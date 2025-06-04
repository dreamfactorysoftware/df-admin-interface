/**
 * @fileoverview Barrel export file for database service list module
 * 
 * Provides centralized imports for database service list components, hooks, types, 
 * and utilities. Enables clean imports like:
 * `import { ServiceListContainer, useServiceList } from '@/components/database-service/service-list'`
 * with full TypeScript support and tree-shaking optimization.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

// Container component for service list page
export { ServiceListContainer } from './service-list-container';
export type { ServiceListContainerProps } from './service-list-container';

// Table component for service display and management
export { ServiceListTable } from './service-list-table';
export type { ServiceListTableProps } from './service-list-table';

// =============================================================================
// REACT HOOKS
// =============================================================================

// Core service list data fetching and state management
export { useServiceList } from './service-list-hooks';
export { useServiceListFilters } from './service-list-hooks';
export { useServiceListMutations } from './service-list-hooks';
export { useServiceListSelection } from './service-list-hooks';

// Advanced functionality hooks
export { useServiceListVirtualization } from './service-list-hooks';
export { useServiceConnectionStatus } from './service-list-hooks';
export { useServiceListExport } from './service-list-hooks';

// Hook return types for type safety
export type {
  UseServiceListResult,
  UseServiceListFiltersResult,
  UseServiceListMutationsResult,
  UseServiceListSelectionResult,
  UseServiceListVirtualizationResult,
  UseServiceConnectionStatusResult,
  UseServiceListExportResult
} from './service-list-hooks';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Component prop interfaces
export type {
  ServiceListProps,
  ServiceListTableProps as ServiceListTableComponentProps,
  ServiceListFilterProps,
  ServiceListHeaderProps,
  ServiceListRowProps
} from './service-list-types';

// Data and state types
export type {
  ServiceListItem,
  ServiceListData,
  ServiceListState,
  ServiceListFilter,
  ServiceListSort,
  ServiceListConfig
} from './service-list-types';

// Table configuration types
export type {
  ServiceListColumnConfig,
  ServiceListTableConfig,
  ServiceListVirtualizationConfig,
  ServiceListPaginationConfig
} from './service-list-types';

// Query and API types
export type {
  ServiceListQuery,
  ServiceListQueryParams,
  ServiceListResponse,
  ServiceListMutationData
} from './service-list-types';

// Selection and action types
export type {
  ServiceListSelection,
  ServiceListAction,
  ServiceListBulkAction,
  ServiceListActionType
} from './service-list-types';

// Form and validation types
export type {
  ServiceListFilterForm,
  ServiceListFilterSchema,
  ServiceListValidation,
  ServiceListFormState
} from './service-list-types';

// Export types
export type {
  ServiceListExportFormat,
  ServiceListExportConfig,
  ServiceListExportData,
  ServiceListExportOptions
} from './service-list-types';

// Connection status types
export type {
  ServiceConnectionStatus,
  ServiceConnectionTest,
  ServiceConnectionResult
} from './service-list-types';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

// Default configuration values
export const SERVICE_LIST_DEFAULTS = {
  PAGE_SIZE: 25,
  CACHE_TIME: 900, // 15 minutes
  STALE_TIME: 300, // 5 minutes
  VIRTUAL_ITEM_HEIGHT: 60,
  MAX_SELECTIONS: 100
} as const;

// Table column identifiers
export const SERVICE_LIST_COLUMNS = {
  NAME: 'name',
  TYPE: 'type',
  STATUS: 'status',
  LAST_MODIFIED: 'lastModified',
  ACTIONS: 'actions'
} as const;

// Filter options
export const SERVICE_LIST_FILTERS = {
  TYPES: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
  STATUS: ['active', 'inactive', 'error'],
  SORT_FIELDS: ['name', 'type', 'lastModified', 'status']
} as const;

// Action types
export const SERVICE_LIST_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  TEST_CONNECTION: 'test_connection',
  CLONE: 'clone',
  EXPORT: 'export'
} as const;

// Export formats
export const SERVICE_LIST_EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'xlsx'
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Type guard to check if a value is a valid service list action
 */
export const isValidServiceListAction = (action: unknown): action is ServiceListActionType => {
  return typeof action === 'string' && 
    Object.values(SERVICE_LIST_ACTIONS).includes(action as ServiceListActionType);
};

/**
 * Type guard to check if a value is a valid export format
 */
export const isValidExportFormat = (format: unknown): format is ServiceListExportFormat => {
  return typeof format === 'string' && 
    Object.values(SERVICE_LIST_EXPORT_FORMATS).includes(format as ServiceListExportFormat);
};

/**
 * Validates service list filter configuration
 */
export const validateServiceListFilters = (filters: Partial<ServiceListFilter>): boolean => {
  if (filters.types && !Array.isArray(filters.types)) return false;
  if (filters.status && !Array.isArray(filters.status)) return false;
  if (filters.sortField && !SERVICE_LIST_FILTERS.SORT_FIELDS.includes(filters.sortField)) return false;
  return true;
};

/**
 * Creates default service list configuration
 */
export const createDefaultServiceListConfig = (): ServiceListConfig => ({
  pageSize: SERVICE_LIST_DEFAULTS.PAGE_SIZE,
  virtualItemHeight: SERVICE_LIST_DEFAULTS.VIRTUAL_ITEM_HEIGHT,
  enableVirtualization: true,
  enableSelection: true,
  enableBulkActions: true,
  enableExport: true,
  cacheConfig: {
    staleTime: SERVICE_LIST_DEFAULTS.STALE_TIME * 1000,
    cacheTime: SERVICE_LIST_DEFAULTS.CACHE_TIME * 1000
  }
});

/**
 * Formats service list data for export
 */
export const formatServiceListForExport = (
  services: ServiceListItem[],
  format: ServiceListExportFormat
): ServiceListExportData => {
  const data = services.map(service => ({
    name: service.name,
    type: service.type,
    status: service.status,
    lastModified: service.lastModified
  }));

  return {
    data,
    format,
    filename: `database-services-${new Date().toISOString().split('T')[0]}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generates service list query parameters from filter state
 */
export const createServiceListQueryParams = (filters: ServiceListFilter): ServiceListQueryParams => ({
  page: filters.page || 1,
  pageSize: filters.pageSize || SERVICE_LIST_DEFAULTS.PAGE_SIZE,
  search: filters.search,
  types: filters.types,
  status: filters.status,
  sortField: filters.sortField,
  sortDirection: filters.sortDirection || 'asc'
});

// =============================================================================
// RE-EXPORTS FOR COMPONENT COMPOSITION
// =============================================================================

// Re-export common React types for convenience
export type { 
  ReactNode, 
  ReactElement, 
  ComponentType, 
  FC, 
  PropsWithChildren 
} from 'react';

// Re-export React Query types for hook consumers
export type {
  UseQueryResult,
  UseMutationResult,
  QueryKey,
  MutationFunction
} from '@tanstack/react-query';

// Re-export TanStack Virtual types for table virtualization
export type {
  VirtualItem,
  Virtualizer,
  VirtualizerOptions
} from '@tanstack/react-virtual';

// Re-export common form types for filter components
export type {
  UseFormReturn,
  FieldValues,
  Control,
  UseFormRegister
} from 'react-hook-form';

// Re-export Zod types for validation schemas
export type {
  ZodSchema,
  ZodType,
  ZodError
} from 'zod';