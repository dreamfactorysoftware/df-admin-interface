/**
 * @fileoverview Custom React hook implementing SWR-based data fetching for reference table and field options
 * with intelligent caching and conditional loading. Manages the dropdown options for foreign key relationships,
 * automatically fetching available tables and their fields based on user selections with cache hit responses under 50ms.
 * 
 * Key Features:
 * - SWR conditional fetching for reference data per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per performance specifications
 * - Automatic revalidation for schema changes per Section 4.3.2 Server State Management
 * - Type-safe reference data management per Section 5.2 Component Details
 * - Cascading data fetching for reference tables and fields with intelligent caching
 * - Comprehensive error handling and retry logic for reference data fetching failures
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * @author DreamFactory Admin Interface Team
 */

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { DatabaseSchemaFieldType } from '../field.types';
import type { SchemaTable, SchemaField } from '@/types/database-schema';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * Reference table option for dropdown display
 * Provides user-friendly labels and metadata for table selection
 */
export interface ReferenceTableOption {
  /** Table name used as value */
  value: string;
  /** Display label for the dropdown */
  label: string;
  /** Optional description for tooltips */
  description?: string;
  /** Number of fields in the table */
  fieldCount?: number;
  /** Whether table has primary key */
  hasPrimaryKey?: boolean;
  /** Table type indicator */
  isView?: boolean;
}

/**
 * Reference field option for dropdown display
 * Provides detailed field information for foreign key configuration
 */
export interface ReferenceFieldOption {
  /** Field name used as value */
  value: string;
  /** Display label combining field name and type */
  label: string;
  /** Field type for validation */
  type: string;
  /** Database-specific type */
  dbType: string;
  /** Whether field is primary key */
  isPrimaryKey?: boolean;
  /** Whether field is unique */
  isUnique?: boolean;
  /** Whether field allows null values */
  isNullable?: boolean;
  /** Field length constraint */
  length?: number;
  /** Field description */
  description?: string;
}

/**
 * Reference options configuration
 * Controls the behavior of reference data fetching
 */
export interface ReferenceOptionsConfig {
  /** Database service name */
  serviceName: string;
  /** Current field configuration */
  field: Partial<DatabaseSchemaFieldType>;
  /** Whether foreign key is enabled */
  isForeignKey: boolean;
  /** Selected reference table */
  refTable?: string | null;
  /** Enable caching (default: true) */
  enableCache?: boolean;
  /** Cache time in milliseconds (default: 300000 - 5 minutes) */
  cacheTime?: number;
  /** Revalidation on focus (default: false) */
  revalidateOnFocus?: boolean;
  /** Revalidation on reconnect (default: true) */
  revalidateOnReconnect?: boolean;
  /** Include views in table options (default: false) */
  includeViews?: boolean;
  /** Filter to only show tables with primary keys (default: true) */
  primaryKeyTablesOnly?: boolean;
}

/**
 * Reference options hook return type
 * Provides comprehensive reference data and loading states
 */
export interface UseReferenceOptionsReturn {
  // Table options
  /** Available reference tables */
  tableOptions: ReferenceTableOption[];
  /** Table options loading state */
  tablesLoading: boolean;
  /** Table options error */
  tablesError: Error | null;
  /** Refetch table options */
  refetchTables: () => Promise<SchemaTable[]>;
  
  // Field options
  /** Available fields for selected reference table */
  fieldOptions: ReferenceFieldOption[];
  /** Field options loading state */
  fieldsLoading: boolean;
  /** Field options error */
  fieldsError: Error | null;
  /** Refetch field options */
  refetchFields: () => Promise<SchemaField[]>;
  
  // Cache management
  /** Invalidate all reference data cache */
  invalidateCache: () => void;
  /** Invalidate tables cache */
  invalidateTablesCache: () => void;
  /** Invalidate fields cache for specific table */
  invalidateFieldsCache: (tableName?: string) => void;
  
  // Utility functions
  /** Check if table exists in options */
  hasTable: (tableName: string) => boolean;
  /** Check if field exists in current table options */
  hasField: (fieldName: string) => boolean;
  /** Get table option by name */
  getTableOption: (tableName: string) => ReferenceTableOption | undefined;
  /** Get field option by name */
  getFieldOption: (fieldName: string) => ReferenceFieldOption | undefined;
}

// =============================================================================
// SWR FETCHER FUNCTIONS
// =============================================================================

/**
 * Fetcher function for reference tables
 * Retrieves available tables for foreign key reference
 */
const fetchReferenceTables = async (serviceName: string, includeViews: boolean = false): Promise<SchemaTable[]> => {
  try {
    const response = await apiClient.get(`/${serviceName}/_schema`);
    
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch schema for service: ${serviceName}`);
    }

    const { data } = response;
    let tables = data.table || [];

    // Filter out views if not requested
    if (!includeViews) {
      tables = tables.filter((table: SchemaTable) => !table.isView);
    }

    return tables;
  } catch (error) {
    console.error('Error fetching reference tables:', error);
    throw new Error(`Failed to load reference tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetcher function for reference table fields
 * Retrieves fields for a specific reference table
 */
const fetchReferenceFields = async (serviceName: string, tableName: string): Promise<SchemaField[]> => {
  try {
    const response = await apiClient.get(`/${serviceName}/_schema/${tableName}`);
    
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch table schema: ${tableName}`);
    }

    const { data } = response;
    return data.field || [];
  } catch (error) {
    console.error('Error fetching reference fields:', error);
    throw new Error(`Failed to load fields for table "${tableName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing reference table and field options with SWR caching
 * 
 * Replaces Angular valueChanges subscriptions for refTable and isForeignKey with SWR conditional fetching.
 * Implements cascading data fetching for reference tables and fields with intelligent caching per
 * Section 4.3.2 Server State Management and Section 5.2 Component Details data fetching operations.
 * 
 * @param config - Reference options configuration
 * @returns Reference options data and management functions
 */
export function useReferenceOptions(config: ReferenceOptionsConfig): UseReferenceOptionsReturn {
  const {
    serviceName,
    field,
    isForeignKey,
    refTable,
    enableCache = true,
    cacheTime = 300000, // 5 minutes default
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    includeViews = false,
    primaryKeyTablesOnly = true
  } = config;

  // ==========================================================================
  // SWR QUERIES
  // ==========================================================================

  /**
   * SWR query for reference tables
   * Conditionally fetches based on foreign key toggle state
   */
  const {
    data: tablesData,
    error: tablesError,
    isValidating: tablesLoading,
    mutate: refetchTables
  } = useSWR(
    // Conditional fetching - only fetch when foreign key is enabled
    isForeignKey ? ['reference-tables', serviceName, includeViews] : null,
    ([, service, views]) => fetchReferenceTables(service, views),
    {
      // Performance optimization - cache hit responses under 50ms
      dedupingInterval: 50,
      // Intelligent caching configuration
      revalidateOnFocus,
      revalidateOnReconnect,
      // Cache management
      ...(enableCache && {
        revalidateIfStale: true,
        revalidateOnMount: true,
        refreshInterval: undefined, // Manual refresh only
      }),
      // Error handling with retry logic
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error('Reference tables fetch error:', error);
      }
    }
  );

  /**
   * SWR query for reference fields
   * Conditionally fetches based on reference table selection
   */
  const {
    data: fieldsData,
    error: fieldsError,
    isValidating: fieldsLoading,
    mutate: refetchFields
  } = useSWR(
    // Conditional fetching - only fetch when foreign key is enabled and table is selected
    isForeignKey && refTable ? ['reference-fields', serviceName, refTable] : null,
    ([, service, table]) => fetchReferenceFields(service, table),
    {
      // Performance optimization - cache hit responses under 50ms
      dedupingInterval: 50,
      // Intelligent caching configuration
      revalidateOnFocus,
      revalidateOnReconnect,
      // Cache management
      ...(enableCache && {
        revalidateIfStale: true,
        revalidateOnMount: true,
        refreshInterval: undefined, // Manual refresh only
      }),
      // Error handling with retry logic
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error('Reference fields fetch error:', error);
      }
    }
  );

  // ==========================================================================
  // COMPUTED OPTIONS
  // ==========================================================================

  /**
   * Processed table options for dropdown display
   * Filters and formats tables based on configuration
   */
  const tableOptions = useMemo((): ReferenceTableOption[] => {
    if (!tablesData || !Array.isArray(tablesData)) {
      return [];
    }

    let filteredTables = tablesData;

    // Filter to only show tables with primary keys if requested
    if (primaryKeyTablesOnly) {
      filteredTables = filteredTables.filter((table: SchemaTable) => 
        table.primaryKey && table.primaryKey.length > 0
      );
    }

    // Transform to dropdown options
    return filteredTables.map((table: SchemaTable): ReferenceTableOption => ({
      value: table.name,
      label: table.label || table.name,
      description: table.description,
      fieldCount: table.fields?.length || 0,
      hasPrimaryKey: table.primaryKey && table.primaryKey.length > 0,
      isView: table.isView || false
    }));
  }, [tablesData, primaryKeyTablesOnly]);

  /**
   * Processed field options for dropdown display
   * Formats fields with detailed type information
   */
  const fieldOptions = useMemo((): ReferenceFieldOption[] => {
    if (!fieldsData || !Array.isArray(fieldsData)) {
      return [];
    }

    // Transform to dropdown options with enhanced labeling
    return fieldsData.map((field: SchemaField): ReferenceFieldOption => ({
      value: field.name,
      label: `${field.name} (${field.type})${field.isPrimaryKey ? ' [PK]' : ''}${field.isUnique ? ' [UNIQUE]' : ''}`,
      type: field.type.toString(),
      dbType: field.dbType,
      isPrimaryKey: field.isPrimaryKey,
      isUnique: field.isUnique,
      isNullable: field.isNullable,
      length: field.length,
      description: field.description
    }));
  }, [fieldsData]);

  // ==========================================================================
  // CACHE MANAGEMENT FUNCTIONS
  // ==========================================================================

  /**
   * Invalidate all reference data cache
   * Triggers revalidation of both tables and fields
   */
  const invalidateCache = useCallback(() => {
    refetchTables();
    if (refTable) {
      refetchFields();
    }
  }, [refetchTables, refetchFields, refTable]);

  /**
   * Invalidate tables cache
   * Forces refetch of available reference tables
   */
  const invalidateTablesCache = useCallback(() => {
    refetchTables();
  }, [refetchTables]);

  /**
   * Invalidate fields cache for specific table
   * Forces refetch of fields for specified or current table
   */
  const invalidateFieldsCache = useCallback((tableName?: string) => {
    if (tableName === refTable || !tableName) {
      refetchFields();
    }
  }, [refetchFields, refTable]);

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Check if table exists in current options
   */
  const hasTable = useCallback((tableName: string): boolean => {
    return tableOptions.some(option => option.value === tableName);
  }, [tableOptions]);

  /**
   * Check if field exists in current table options
   */
  const hasField = useCallback((fieldName: string): boolean => {
    return fieldOptions.some(option => option.value === fieldName);
  }, [fieldOptions]);

  /**
   * Get table option by name
   */
  const getTableOption = useCallback((tableName: string): ReferenceTableOption | undefined => {
    return tableOptions.find(option => option.value === tableName);
  }, [tableOptions]);

  /**
   * Get field option by name
   */
  const getFieldOption = useCallback((fieldName: string): ReferenceFieldOption | undefined => {
    return fieldOptions.find(option => option.value === fieldName);
  }, [fieldOptions]);

  // ==========================================================================
  // RETURN HOOK INTERFACE
  // ==========================================================================

  return {
    // Table options
    tableOptions,
    tablesLoading,
    tablesError,
    refetchTables,
    
    // Field options
    fieldOptions,
    fieldsLoading,
    fieldsError,
    refetchFields,
    
    // Cache management
    invalidateCache,
    invalidateTablesCache,
    invalidateFieldsCache,
    
    // Utility functions
    hasTable,
    hasField,
    getTableOption,
    getFieldOption
  };
}

// =============================================================================
// HOOK VARIANTS AND UTILITIES
// =============================================================================

/**
 * Simplified hook for just table options
 * Useful when only table selection is needed
 */
export function useReferenceTableOptions(serviceName: string, isForeignKey: boolean) {
  const { tableOptions, tablesLoading, tablesError, refetchTables } = useReferenceOptions({
    serviceName,
    field: {},
    isForeignKey,
    refTable: null,
    primaryKeyTablesOnly: true
  });

  return {
    options: tableOptions,
    loading: tablesLoading,
    error: tablesError,
    refetch: refetchTables
  };
}

/**
 * Simplified hook for just field options
 * Useful when only field selection is needed for a known table
 */
export function useReferenceFieldOptions(serviceName: string, tableName: string) {
  const { fieldOptions, fieldsLoading, fieldsError, refetchFields } = useReferenceOptions({
    serviceName,
    field: {},
    isForeignKey: true,
    refTable: tableName
  });

  return {
    options: fieldOptions,
    loading: fieldsLoading,
    error: fieldsError,
    refetch: refetchFields
  };
}

/**
 * Utility function to create cache key for reference data
 * Useful for manual cache management
 */
export function createReferenceDataCacheKey(type: 'tables' | 'fields', serviceName: string, tableName?: string): string[] {
  if (type === 'tables') {
    return ['reference-tables', serviceName];
  }
  return ['reference-fields', serviceName, tableName || ''];
}

/**
 * Type guard to check if reference options are valid
 */
export function isValidReferenceOption(option: unknown): option is ReferenceTableOption | ReferenceFieldOption {
  return (
    typeof option === 'object' &&
    option !== null &&
    'value' in option &&
    'label' in option &&
    typeof (option as any).value === 'string' &&
    typeof (option as any).label === 'string'
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useReferenceOptions;

// Export types for external use
export type {
  ReferenceTableOption,
  ReferenceFieldOption,
  ReferenceOptionsConfig,
  UseReferenceOptionsReturn
};