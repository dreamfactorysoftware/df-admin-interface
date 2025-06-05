/**
 * Reference Options Hook for Foreign Key Field Management
 * 
 * Custom React hook implementing SWR-based data fetching for reference table and field options
 * with intelligent caching and conditional loading. Manages the dropdown options for foreign key
 * relationships, automatically fetching available tables and their fields based on user selections
 * with cache hit responses under 50ms per React/Next.js Integration Requirements.
 * 
 * Features:
 * - SWR conditional fetching for reference data per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per performance requirements
 * - Automatic revalidation for schema changes per Section 4.3.2 Server State Management
 * - Type-safe reference data management per Section 5.2 Component Details
 * - Cascading data fetching for reference tables and fields with intelligent caching
 * - Conditional SWR hooks based on foreign key toggle state
 * - Automatic cache invalidation when database schema changes
 * - Error handling and retry logic for reference data fetching failures
 * 
 * @fileoverview Foreign key reference options management hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import type { SWRConfiguration } from 'swr';
import { createCrudClient, type ListResponse } from '@/lib/api-client';
import type { DatabaseTable, DatabaseField } from '@/types/database';
import type { FieldFormData } from '../field.types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Reference table option for dropdown display
 * Simplified table metadata for field reference configuration
 */
export interface ReferenceTableOption {
  /** Table name (database identifier) */
  value: string;
  /** Display label for dropdown */
  label: string;
  /** Optional table description */
  description?: string;
  /** Number of fields in table */
  fieldCount: number;
  /** Whether table is a system table */
  isSystem?: boolean;
}

/**
 * Reference field option for dropdown display
 * Field metadata for foreign key target selection
 */
export interface ReferenceFieldOption {
  /** Field name (database identifier) */
  value: string;
  /** Display label for dropdown */
  label: string;
  /** Field data type */
  type: string;
  /** Whether field is primary key */
  isPrimaryKey: boolean;
  /** Whether field is unique */
  isUnique: boolean;
  /** Optional field description */
  description?: string;
}

/**
 * Hook configuration options
 */
export interface UseReferenceOptionsConfig {
  /** Service name for API requests */
  serviceName: string;
  /** Whether foreign key mode is enabled */
  isForeignKey: boolean;
  /** Selected reference table name */
  referenceTable?: string;
  /** Custom SWR configuration */
  swrConfig?: SWRConfiguration;
  /** Enable aggressive caching (default: true) */
  enableCaching?: boolean;
  /** Custom cache key prefix */
  cacheKeyPrefix?: string;
}

/**
 * Hook return interface
 */
export interface UseReferenceOptionsReturn {
  // Table options
  /** Available reference table options */
  tableOptions: ReferenceTableOption[];
  /** Loading state for table options */
  isLoadingTables: boolean;
  /** Error state for table options */
  tableError?: Error;
  
  // Field options
  /** Available reference field options for selected table */
  fieldOptions: ReferenceFieldOption[];
  /** Loading state for field options */
  isLoadingFields: boolean;
  /** Error state for field options */
  fieldError?: Error;
  
  // Cache management
  /** Manually refresh table options */
  refreshTables: () => Promise<void>;
  /** Manually refresh field options */
  refreshFields: () => Promise<void>;
  /** Clear all reference option caches */
  clearCache: () => Promise<void>;
  
  // Validation helpers
  /** Check if selected reference table exists */
  isValidReferenceTable: (tableName: string) => boolean;
  /** Check if selected reference field exists */
  isValidReferenceField: (fieldName: string) => boolean;
  /** Get field type for selected reference field */
  getReferenceFieldType: (fieldName: string) => string | undefined;
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default SWR configuration optimized for reference data caching
 * Implements cache hit responses under 50ms requirement
 */
const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  // Cache configuration for sub-50ms responses
  dedupingInterval: 5000, // 5 seconds deduplication
  focusThrottleInterval: 5000, // 5 seconds focus throttle
  errorRetryInterval: 10000, // 10 seconds error retry
  
  // Revalidation settings per Section 4.3.2 Server State Management
  revalidateOnFocus: true, // Revalidate on window focus
  revalidateOnReconnect: true, // Revalidate on network reconnect
  revalidateIfStale: true, // Revalidate if data is stale
  
  // Performance optimizations
  shouldRetryOnError: true,
  errorRetryCount: 3,
  refreshInterval: 300000, // 5 minutes auto-refresh for schema changes
  
  // Cache persistence
  suspense: false,
  fallbackData: undefined,
  keepPreviousData: true, // Maintain previous data during refetch
};

/**
 * Cache key generators for consistent cache management
 */
const CACHE_KEYS = {
  tables: (serviceName: string, prefix?: string) => 
    `${prefix || 'reference'}/tables/${serviceName}`,
  fields: (serviceName: string, tableName: string, prefix?: string) => 
    `${prefix || 'reference'}/fields/${serviceName}/${tableName}`,
  schema: (serviceName: string, prefix?: string) => 
    `${prefix || 'reference'}/schema/${serviceName}`,
} as const;

/**
 * Error messages for reference data fetching
 */
const ERROR_MESSAGES = {
  FETCH_TABLES: 'Failed to fetch reference table options',
  FETCH_FIELDS: 'Failed to fetch reference field options',
  INVALID_SERVICE: 'Invalid service name provided',
  INVALID_TABLE: 'Selected reference table does not exist',
  INVALID_FIELD: 'Selected reference field does not exist',
  NETWORK_ERROR: 'Network error while fetching reference data',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Transform database table to reference table option
 * Optimizes dropdown display with essential metadata
 */
function transformTableToOption(table: DatabaseTable): ReferenceTableOption {
  return {
    value: table.name,
    label: table.label || table.name,
    description: table.description,
    fieldCount: table.fieldCount || 0,
    isSystem: table.isSystem || false,
  };
}

/**
 * Transform database field to reference field option
 * Filters suitable fields for foreign key references
 */
function transformFieldToOption(field: DatabaseField): ReferenceFieldOption {
  return {
    value: field.name,
    label: field.label || field.name,
    type: field.type,
    isPrimaryKey: field.isPrimaryKey,
    isUnique: field.isUnique,
    description: field.description,
  };
}

/**
 * Filter suitable reference tables
 * Excludes system tables unless explicitly enabled
 */
function filterReferenceTables(tables: DatabaseTable[]): DatabaseTable[] {
  return tables.filter(table => {
    // Include non-system tables and tables with at least one field
    return !table.isSystem && table.fieldCount > 0;
  });
}

/**
 * Filter suitable reference fields
 * Prioritizes primary keys and unique fields for foreign key references
 */
function filterReferenceFields(fields: DatabaseField[]): DatabaseField[] {
  return fields
    .filter(field => {
      // Include fields that can serve as foreign key targets
      return !field.isVirtual && (field.isPrimaryKey || field.isUnique || field.name === 'id');
    })
    .sort((a, b) => {
      // Sort by suitability: primary key, unique, then alphabetical
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
      if (a.isUnique && !b.isUnique) return -1;
      if (!a.isUnique && b.isUnique) return 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Create error with context for better debugging
 */
function createContextError(message: string, context: Record<string, any>): Error {
  const error = new Error(message);
  (error as any).context = context;
  return error;
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing foreign key reference options
 * 
 * Provides SWR-based data fetching for reference tables and fields with intelligent
 * caching and conditional loading. Automatically fetches available tables when foreign
 * key mode is enabled and fetches fields when a reference table is selected.
 * 
 * @param config - Hook configuration options
 * @returns Reference options with loading states and cache management
 * 
 * @example
 * ```typescript
 * // Basic usage in field form component
 * const {
 *   tableOptions,
 *   fieldOptions,
 *   isLoadingTables,
 *   isLoadingFields,
 *   isValidReferenceTable,
 *   refreshTables,
 * } = useReferenceOptions({
 *   serviceName: 'mysql_db',
 *   isForeignKey: form.watch('isForeignKey'),
 *   referenceTable: form.watch('referenceTable'),
 * });
 * 
 * // Advanced usage with custom configuration
 * const referenceOptions = useReferenceOptions({
 *   serviceName: 'postgresql_db',
 *   isForeignKey: true,
 *   referenceTable: 'users',
 *   swrConfig: {
 *     refreshInterval: 60000, // 1 minute
 *     revalidateOnFocus: false,
 *   },
 *   enableCaching: true,
 *   cacheKeyPrefix: 'custom-prefix',
 * });
 * ```
 */
export function useReferenceOptions(config: UseReferenceOptionsConfig): UseReferenceOptionsReturn {
  const {
    serviceName,
    isForeignKey,
    referenceTable,
    swrConfig = {},
    enableCaching = true,
    cacheKeyPrefix,
  } = config;

  // Merge configuration with defaults
  const mergedConfig: SWRConfiguration = useMemo(() => ({
    ...DEFAULT_SWR_CONFIG,
    ...swrConfig,
    // Override caching if disabled
    ...(enableCaching ? {} : {
      dedupingInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }),
  }), [swrConfig, enableCaching]);

  // Generate cache keys
  const tablesCacheKey = useMemo(() => 
    CACHE_KEYS.tables(serviceName, cacheKeyPrefix),
    [serviceName, cacheKeyPrefix]
  );
  
  const fieldsCacheKey = useMemo(() => 
    referenceTable ? CACHE_KEYS.fields(serviceName, referenceTable, cacheKeyPrefix) : null,
    [serviceName, referenceTable, cacheKeyPrefix]
  );

  // Create API client instance
  const crudClient = useMemo(() => createCrudClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  }), []);

  // =============================================================================
  // TABLE OPTIONS FETCHING
  // =============================================================================

  /**
   * Fetch reference table options
   * Conditional fetching based on foreign key toggle state
   */
  const {
    data: tablesData,
    error: tableError,
    isLoading: isLoadingTables,
    mutate: mutateTables,
  } = useSWR<ListResponse<DatabaseTable>>(
    // Only fetch when foreign key mode is enabled and service is valid
    isForeignKey && serviceName ? tablesCacheKey : null,
    async () => {
      try {
        if (!serviceName) {
          throw createContextError(ERROR_MESSAGES.INVALID_SERVICE, { serviceName });
        }

        // Fetch schema for the service to get table list
        const response = await crudClient.getAll<DatabaseTable>(
          `api/v2/${serviceName}/_schema`,
          {
            fields: 'name,label,description,fieldCount,isSystem,type',
            limit: 1000, // Support up to 1000 tables per requirements
          }
        );

        if (!response.success) {
          throw createContextError(ERROR_MESSAGES.FETCH_TABLES, {
            serviceName,
            error: response.error,
          });
        }

        return response;
      } catch (error) {
        const contextError = error instanceof Error ? error : 
          createContextError(ERROR_MESSAGES.NETWORK_ERROR, { serviceName, originalError: error });
        
        // Log error for debugging
        console.error('Reference tables fetch error:', {
          serviceName,
          error: contextError,
          context: (contextError as any).context,
        });

        throw contextError;
      }
    },
    mergedConfig
  );

  // =============================================================================
  // FIELD OPTIONS FETCHING
  // =============================================================================

  /**
   * Fetch reference field options for selected table
   * Conditional fetching based on table selection
   */
  const {
    data: fieldsData,
    error: fieldError,
    isLoading: isLoadingFields,
    mutate: mutateFields,
  } = useSWR<ListResponse<DatabaseField>>(
    // Only fetch when foreign key mode is enabled, service is valid, and table is selected
    isForeignKey && serviceName && referenceTable ? fieldsCacheKey : null,
    async () => {
      try {
        if (!serviceName || !referenceTable) {
          throw createContextError(ERROR_MESSAGES.INVALID_SERVICE, { 
            serviceName, 
            referenceTable 
          });
        }

        // Fetch field schema for the selected reference table
        const response = await crudClient.getAll<DatabaseField>(
          `api/v2/${serviceName}/_schema/${referenceTable}`,
          {
            fields: 'name,label,description,type,isPrimaryKey,isUnique,isVirtual',
            limit: 100, // Reasonable limit for table fields
          }
        );

        if (!response.success) {
          throw createContextError(ERROR_MESSAGES.FETCH_FIELDS, {
            serviceName,
            referenceTable,
            error: response.error,
          });
        }

        return response;
      } catch (error) {
        const contextError = error instanceof Error ? error : 
          createContextError(ERROR_MESSAGES.NETWORK_ERROR, { 
            serviceName, 
            referenceTable, 
            originalError: error 
          });
        
        // Log error for debugging
        console.error('Reference fields fetch error:', {
          serviceName,
          referenceTable,
          error: contextError,
          context: (contextError as any).context,
        });

        throw contextError;
      }
    },
    mergedConfig
  );

  // =============================================================================
  // DATA TRANSFORMATION AND MEMOIZATION
  // =============================================================================

  /**
   * Transform and filter table options for dropdown display
   * Memoized for performance with intelligent filtering
   */
  const tableOptions = useMemo<ReferenceTableOption[]>(() => {
    if (!tablesData?.data) return [];

    try {
      const filteredTables = filterReferenceTables(tablesData.data);
      return filteredTables
        .map(transformTableToOption)
        .sort((a, b) => {
          // Sort by system status, then alphabetically
          if (a.isSystem !== b.isSystem) {
            return a.isSystem ? 1 : -1;
          }
          return a.label.localeCompare(b.label);
        });
    } catch (error) {
      console.error('Table options transformation error:', error);
      return [];
    }
  }, [tablesData?.data]);

  /**
   * Transform and filter field options for dropdown display
   * Memoized for performance with suitability-based sorting
   */
  const fieldOptions = useMemo<ReferenceFieldOption[]>(() => {
    if (!fieldsData?.data) return [];

    try {
      const filteredFields = filterReferenceFields(fieldsData.data);
      return filteredFields.map(transformFieldToOption);
    } catch (error) {
      console.error('Field options transformation error:', error);
      return [];
    }
  }, [fieldsData?.data]);

  // =============================================================================
  // CACHE MANAGEMENT FUNCTIONS
  // =============================================================================

  /**
   * Manually refresh table options
   * Implements automatic cache invalidation per Section 4.3.2
   */
  const refreshTables = async (): Promise<void> => {
    try {
      await mutateTables();
    } catch (error) {
      console.error('Failed to refresh table options:', error);
      throw error;
    }
  };

  /**
   * Manually refresh field options
   */
  const refreshFields = async (): Promise<void> => {
    try {
      if (fieldsCacheKey) {
        await mutateFields();
      }
    } catch (error) {
      console.error('Failed to refresh field options:', error);
      throw error;
    }
  };

  /**
   * Clear all reference option caches
   * Useful for schema change invalidation
   */
  const clearCache = async (): Promise<void> => {
    try {
      // Clear all related cache keys
      const cacheKeys = [
        tablesCacheKey,
        fieldsCacheKey,
        CACHE_KEYS.schema(serviceName, cacheKeyPrefix),
      ].filter(Boolean) as string[];

      await Promise.all(cacheKeys.map(key => mutate(key, undefined, false)));
    } catch (error) {
      console.error('Failed to clear reference options cache:', error);
      throw error;
    }
  };

  // =============================================================================
  // VALIDATION HELPER FUNCTIONS
  // =============================================================================

  /**
   * Check if selected reference table exists and is valid
   */
  const isValidReferenceTable = (tableName: string): boolean => {
    return tableOptions.some(option => option.value === tableName);
  };

  /**
   * Check if selected reference field exists and is valid
   */
  const isValidReferenceField = (fieldName: string): boolean => {
    return fieldOptions.some(option => option.value === fieldName);
  };

  /**
   * Get field type for selected reference field
   */
  const getReferenceFieldType = (fieldName: string): string | undefined => {
    const field = fieldOptions.find(option => option.value === fieldName);
    return field?.type;
  };

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Table options
    tableOptions,
    isLoadingTables,
    tableError,
    
    // Field options
    fieldOptions,
    isLoadingFields,
    fieldError,
    
    // Cache management
    refreshTables,
    refreshFields,
    clearCache,
    
    // Validation helpers
    isValidReferenceTable,
    isValidReferenceField,
    getReferenceFieldType,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Pre-configured hook for common use cases
 * Provides sensible defaults for typical field reference scenarios
 */
export function useBasicReferenceOptions(
  serviceName: string,
  formData: Pick<FieldFormData, 'isForeignKey' | 'referenceTable'>
): UseReferenceOptionsReturn {
  return useReferenceOptions({
    serviceName,
    isForeignKey: formData.isForeignKey,
    referenceTable: formData.referenceTable,
    enableCaching: true,
  });
}

/**
 * Hook for development/testing with aggressive caching disabled
 */
export function useDevReferenceOptions(
  serviceName: string,
  isForeignKey: boolean,
  referenceTable?: string
): UseReferenceOptionsReturn {
  return useReferenceOptions({
    serviceName,
    isForeignKey,
    referenceTable,
    enableCaching: false,
    swrConfig: {
      revalidateOnFocus: true,
      refreshInterval: 10000, // 10 seconds for development
    },
  });
}

/**
 * Export types for external consumption
 */
export type {
  ReferenceTableOption,
  ReferenceFieldOption,
  UseReferenceOptionsConfig,
  UseReferenceOptionsReturn,
};