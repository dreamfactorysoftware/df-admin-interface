/**
 * Global Lookup Keys Type Definitions
 * 
 * Maintains full API compatibility with DreamFactory backend while supporting
 * React component integration for lookup key management functionality.
 * 
 * Global lookup keys provide system-wide configuration values that can be
 * referenced throughout the DreamFactory platform for dynamic configuration
 * and customization without requiring code changes.
 */

/**
 * Core lookup key interface maintaining exact backend API compatibility.
 * 
 * This interface preserves the original DreamFactory lookup key data structure
 * to ensure seamless integration with existing backend endpoints and services.
 * All field names, types, and constraints remain unchanged from the Angular implementation.
 */
export interface LookupKeyType {
  /** Unique identifier for the lookup key (null for new entries) */
  id?: number | null;
  
  /** 
   * Unique name identifier for the lookup key
   * Must be unique across all lookup keys in the system
   * Used as the reference key for retrieving values
   */
  name: string;
  
  /** 
   * The configuration value associated with the lookup key
   * Can contain any string value including JSON, URLs, or plain text
   */
  value: string;
  
  /** 
   * Privacy flag indicating if the lookup key value should be hidden
   * Private keys are typically used for sensitive configuration values
   * like API keys, passwords, or internal system settings
   */
  private: boolean;
  
  /** 
   * Optional human-readable description of the lookup key's purpose
   * Used for documentation and administrative clarity
   */
  description?: string;
  
  /** ISO timestamp of when the lookup key was created */
  created_date?: string;
  
  /** ISO timestamp of when the lookup key was last modified */
  last_modified_date?: string;
  
  /** User ID of the person who created this lookup key */
  created_by_id?: number;
  
  /** User ID of the person who last modified this lookup key */
  last_modified_by_id?: number;
}

/**
 * Form data structure for React Hook Form integration
 * 
 * Extends the base LookupKeyType to support React component patterns
 * and form validation requirements in the lookup keys management interface.
 */
export interface LookupKeyFormData extends LookupKeyType {
  /** Internal form state tracking for React Hook Form */
  _isNew?: boolean;
  
  /** Validation state for unique name constraint checking */
  _nameValidation?: {
    isValid: boolean;
    isChecking: boolean;
    errorMessage?: string;
  };
  
  /** UI state for expanded/collapsed display in accordion views */
  _expanded?: boolean;
}

/**
 * API request payload for creating new lookup keys
 * 
 * Defines the structure expected by DreamFactory backend endpoints
 * when creating multiple lookup keys in a single request.
 */
export interface CreateLookupKeysRequest {
  /** Array of lookup key objects to create */
  resource: Omit<LookupKeyType, 'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id'>[];
}

/**
 * API request payload for updating existing lookup keys
 * 
 * Defines the structure for individual lookup key updates
 * maintaining compatibility with DreamFactory PATCH/PUT operations.
 */
export interface UpdateLookupKeyRequest extends Omit<LookupKeyType, 'created_date' | 'created_by_id'> {
  /** Required ID for update operations */
  id: number;
}

/**
 * API response structure for lookup key operations
 * 
 * Standard DreamFactory response format for lookup key endpoints
 * including metadata and resource data.
 */
export interface LookupKeysResponse {
  /** Array of lookup key objects returned from the API */
  resource: LookupKeyType[];
  
  /** API response metadata */
  meta?: {
    /** Total count of lookup keys in the system */
    count?: number;
    
    /** Schema information for the lookup keys resource */
    schema?: string[];
  };
}

/**
 * Lookup key validation constraints for React components
 * 
 * Defines validation rules that must be enforced in React forms
 * to maintain data integrity and backend compatibility.
 */
export interface LookupKeyValidation {
  /** Name field validation rules */
  name: {
    required: true;
    minLength: 1;
    maxLength: 255;
    pattern: string; // Must be valid identifier pattern
    unique: true; // Must be unique across all lookup keys
  };
  
  /** Value field validation rules */
  value: {
    required: false;
    maxLength: 65535; // Text field limit
  };
  
  /** Description field validation rules */
  description: {
    required: false;
    maxLength: 1000;
  };
}

/**
 * Lookup keys management component props interface
 * 
 * Defines the interface for React components that handle lookup key
 * operations, ensuring consistent prop structure across components.
 */
export interface LookupKeysComponentProps {
  /** Initial lookup keys data to display */
  initialData?: LookupKeyType[];
  
  /** Whether to show the accordion wrapper interface */
  showAccordion?: boolean;
  
  /** Whether the form is in read-only mode */
  readOnly?: boolean;
  
  /** Callback function for handling save operations */
  onSave?: (keys: LookupKeyType[]) => Promise<void>;
  
  /** Callback function for handling validation errors */
  onValidationError?: (errors: Record<string, string>) => void;
  
  /** Loading state for async operations */
  loading?: boolean;
  
  /** Error state for displaying operation failures */
  error?: string | null;
  
  /** CSS class name for custom styling */
  className?: string;
}

/**
 * Lookup key table column definition for data tables
 * 
 * Defines the structure for displaying lookup keys in table format
 * with sorting, filtering, and action capabilities.
 */
export interface LookupKeyTableColumn {
  /** Column identifier */
  key: keyof LookupKeyType | 'actions';
  
  /** Display label for the column header */
  label: string;
  
  /** Whether the column is sortable */
  sortable?: boolean;
  
  /** Whether the column is filterable */
  filterable?: boolean;
  
  /** Whether the column should be hidden for private values */
  hideForPrivate?: boolean;
  
  /** Custom render function for the column content */
  render?: (value: any, row: LookupKeyType) => React.ReactNode;
  
  /** Column width specification */
  width?: string | number;
  
  /** Whether the column should stick to the end */
  sticky?: boolean;
}

/**
 * Hook return type for lookup keys management operations
 * 
 * Defines the interface returned by custom React hooks that handle
 * lookup key CRUD operations and state management.
 */
export interface UseLookupKeysReturn {
  /** Current lookup keys data */
  lookupKeys: LookupKeyType[];
  
  /** Loading state for data fetching */
  loading: boolean;
  
  /** Error state for operation failures */
  error: string | null;
  
  /** Function to create new lookup keys */
  createLookupKeys: (keys: Omit<LookupKeyType, 'id'>[]) => Promise<void>;
  
  /** Function to update existing lookup keys */
  updateLookupKey: (id: number, key: Partial<LookupKeyType>) => Promise<void>;
  
  /** Function to delete lookup keys */
  deleteLookupKey: (id: number) => Promise<void>;
  
  /** Function to validate unique name constraint */
  validateUniqueName: (name: string, excludeId?: number) => Promise<boolean>;
  
  /** Function to refresh lookup keys data */
  refetch: () => Promise<void>;
  
  /** Optimistic update state tracking */
  isUpdating: boolean;
}

/**
 * Lookup key search and filter options
 * 
 * Defines the interface for searching and filtering lookup keys
 * in management interfaces with support for various criteria.
 */
export interface LookupKeyFilters {
  /** Text search across name, value, and description fields */
  search?: string;
  
  /** Filter by private flag status */
  private?: boolean | null;
  
  /** Filter by creation date range */
  createdDateRange?: {
    start: string;
    end: string;
  };
  
  /** Filter by specific user who created the keys */
  createdBy?: number;
  
  /** Sort configuration */
  sort?: {
    field: keyof LookupKeyType;
    direction: 'asc' | 'desc';
  };
  
  /** Pagination configuration */
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Bulk operations interface for lookup key management
 * 
 * Defines the structure for performing bulk operations on multiple
 * lookup keys simultaneously with proper error handling.
 */
export interface LookupKeyBulkOperations {
  /** Export selected lookup keys to various formats */
  export: (ids: number[], format: 'json' | 'csv' | 'yaml') => Promise<Blob>;
  
  /** Import lookup keys from file upload */
  import: (file: File, options?: { overwrite?: boolean }) => Promise<{
    success: number;
    errors: Array<{ row: number; error: string }>;
  }>;
  
  /** Delete multiple lookup keys */
  bulkDelete: (ids: number[]) => Promise<void>;
  
  /** Update multiple lookup keys with same values */
  bulkUpdate: (ids: number[], updates: Partial<LookupKeyType>) => Promise<void>;
}

/**
 * Type guards for runtime type checking
 * 
 * Utility functions to verify object types at runtime for enhanced
 * type safety in React components and API interactions.
 */
export const isLookupKeyType = (obj: any): obj is LookupKeyType => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.value === 'string' &&
    typeof obj.private === 'boolean'
  );
};

export const isLookupKeyFormData = (obj: any): obj is LookupKeyFormData => {
  return isLookupKeyType(obj);
};

/**
 * Default values for new lookup key creation
 * 
 * Provides sensible defaults for creating new lookup key entries
 * in React forms and components.
 */
export const DEFAULT_LOOKUP_KEY: Omit<LookupKeyType, 'id'> = {
  name: '',
  value: '',
  private: false,
  description: ''
} as const;

/**
 * Validation schema configuration for React Hook Form integration
 * 
 * Defines the validation rules that can be used with libraries like
 * Zod or Yup for comprehensive form validation in React components.
 */
export const LOOKUP_KEY_VALIDATION_SCHEMA = {
  name: {
    required: 'Name is required',
    minLength: { value: 1, message: 'Name must not be empty' },
    maxLength: { value: 255, message: 'Name must be less than 255 characters' },
    pattern: {
      value: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      message: 'Name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    }
  },
  value: {
    maxLength: { value: 65535, message: 'Value must be less than 65535 characters' }
  },
  description: {
    maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
  }
} as const;

/**
 * API endpoint constants for lookup key operations
 * 
 * Centralized endpoint definitions for consistent API communication
 * across React components and services.
 */
export const LOOKUP_KEY_ENDPOINTS = {
  BASE: '/system/global_lookup',
  CREATE: '/system/global_lookup',
  UPDATE: (id: number) => `/system/global_lookup/${id}`,
  DELETE: (id: number) => `/system/global_lookup/${id}`,
  BATCH: '/system/global_lookup'
} as const;