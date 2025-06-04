/**
 * Lookup Keys Type Definitions
 * 
 * TypeScript interfaces and types for global lookup key management
 * in the DreamFactory Admin Interface.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Represents a global lookup key entry
 */
export interface LookupKeyType {
  /** Unique identifier for the lookup key */
  id?: number;
  /** Unique name for the lookup key */
  name: string;
  /** Value associated with the lookup key */
  value: string;
  /** Whether the lookup key is private/internal */
  private: boolean;
  /** Optional description of the lookup key */
  description?: string;
  /** Creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** ID of user who created the entry */
  created_by_id?: number;
  /** ID of user who last modified the entry */
  last_modified_by_id?: number;
}

/**
 * Payload for creating a new lookup key
 */
export interface CreateLookupKeyPayload {
  name: string;
  value: string;
  private: boolean;
  description?: string;
}

/**
 * Payload for updating an existing lookup key
 */
export interface UpdateLookupKeyPayload {
  id: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
}

/**
 * Batch operation payloads
 */
export interface BatchCreateLookupKeysPayload {
  resource: CreateLookupKeyPayload[];
}

export interface BatchUpdateLookupKeysPayload {
  resource: UpdateLookupKeyPayload[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data for lookup key entry
 */
export interface LookupKeyFormData {
  name: string;
  value: string;
  private: boolean;
  id?: number;
}

/**
 * Form state for managing multiple lookup keys
 */
export interface LookupKeysFormData {
  lookupKeys: LookupKeyFormData[];
}

// ============================================================================
// TABLE TYPES
// ============================================================================

/**
 * Row data for lookup keys table display
 */
export interface LookupKeyRowData {
  id?: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response for lookup keys list
 */
export interface LookupKeysListResponse {
  resource: LookupKeyType[];
  meta?: {
    count: number;
    offset: number;
    limit: number;
  };
}

/**
 * API response for single lookup key
 */
export interface LookupKeyResponse {
  resource: LookupKeyType;
}

/**
 * Error response from lookup keys API
 */
export interface LookupKeyErrorResponse {
  error: {
    code: number;
    message: string;
    context?: Record<string, any>;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error for lookup key fields
 */
export interface LookupKeyValidationError {
  field: keyof LookupKeyFormData;
  message: string;
}

/**
 * Validation state for lookup key form
 */
export interface LookupKeyValidationState {
  isValid: boolean;
  errors: LookupKeyValidationError[];
  hasUniqueNames: boolean;
  duplicateNames: string[];
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

/**
 * Filtering options for lookup keys
 */
export interface LookupKeyFilters {
  name?: string;
  private?: boolean;
  includeSystem?: boolean;
}

/**
 * Sorting options for lookup keys
 */
export interface LookupKeySortOptions {
  field: keyof LookupKeyType;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Utility type for partial lookup key updates
 */
export type PartialLookupKey = Partial<LookupKeyType> & {
  id: number;
};

/**
 * Utility type for lookup key without system fields
 */
export type UserLookupKey = Omit<LookupKeyType, 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id'>;

/**
 * Utility type for required lookup key fields
 */
export type RequiredLookupKeyFields = Pick<LookupKeyType, 'name' | 'value' | 'private'>;

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export core types for convenience
  LookupKeyType as LookupKey,
  LookupKeyFormData as LookupKeyForm,
  LookupKeysFormData as LookupKeysForm,
  LookupKeyRowData as LookupKeyRow,
};