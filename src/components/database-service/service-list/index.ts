/**
 * Database Service List Module - Barrel Export
 * 
 * Centralized export file for all database service list components, hooks, types, and utilities.
 * Provides a clean API surface for importing service list functionality throughout the application.
 * Organized by category for optimal tree-shaking and developer experience.
 * 
 * This module implements React 19 stable features with TypeScript 5.8+ module system support,
 * following React ecosystem best practices for component organization and export patterns.
 * Optimized for Turbopack build pipeline with tree-shaking support per Section 7.1.1 requirements.
 * 
 * @fileoverview Service list module barrel exports with TypeScript optimization
 * @version 1.0.0
 * @since 2024-01-01
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Main service list components
 * Primary React components for database service list management
 */
export { default as ServiceListContainer } from './service-list-container';
export { 
  ServiceListTable,
  default as ServiceListTableComponent 
} from './service-list-table';

/**
 * Component implementation exports for testing and advanced usage
 * Internal components exposed for unit testing and custom integrations
 */
export {
  ServiceListContainerImplementation,
  useServiceListContainerStore
} from './service-list-container';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * Core service list hooks
 * Primary React hooks for service list data management and operations
 */
export {
  useServiceList,
  useServiceListComplete,
  useServiceListStore
} from './service-list-hooks';

/**
 * Specialized service list hooks
 * Focused hooks for specific service list functionality
 */
export {
  useServiceListFilters,
  useServiceListMutations,
  useServiceListSelection,
  useServiceListVirtualization,
  useServiceConnectionStatus,
  useServiceListExport
} from './service-list-hooks';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Component prop types
 * TypeScript interfaces for service list component props
 */
export type {
  ServiceListContainerProps,
  ServiceListTableProps,
  ServiceListItemProps,
  ServiceListCellProps
} from './service-list-types';

/**
 * Component ref types
 * TypeScript interfaces for component imperative handles
 */
export type {
  ServiceListTableRef
} from './service-list-table';

export type {
  ServiceListContainerStore
} from './service-list-container';

/**
 * Table configuration types
 * TypeScript interfaces for table behavior and display
 */
export type {
  ServiceListColumn,
  TableSelectionConfig,
  PaginationConfig,
  SortingConfig,
  FilteringConfig,
  VirtualizationConfig
} from './service-list-types';

/**
 * Data and filter types
 * TypeScript interfaces for service list data structures
 */
export type {
  ServiceListFilters,
  ServiceListSort,
  ServiceListState,
  ServiceListActions,
  ServiceListContextType,
  DateRange,
  QuickFilter,
  AdvancedFilter,
  FilterOption
} from './service-list-types';

/**
 * Hook return types
 * TypeScript interfaces for custom hook return values
 */
export type {
  UseServiceListReturn,
  ServiceListQueryOptions,
  ServiceListMutationOptions
} from './service-list-types';

export type {
  ServiceListFilters as ServiceListFiltersType,
  ServiceListPagination,
  ServiceListQuery,
  ServiceListResponse,
  ServiceListStore as ServiceListStoreType,
  ExportFormat,
  ExportOptions
} from './service-list-hooks';

/**
 * Action and interaction types
 * TypeScript interfaces for user interactions and bulk operations
 */
export type {
  BulkActionType,
  BulkActionConfig,
  ServiceActionConfig,
  ContextMenuItem
} from './service-list-types';

/**
 * Virtualization types
 * TypeScript interfaces for virtual scrolling implementation
 */
export type {
  VirtualListItemProps,
  VirtualListRef
} from './service-list-types';

/**
 * Paywall and access control types
 * TypeScript interfaces for feature restrictions and upgrade prompts
 */
export type {
  PaywallConfig,
  FeatureRestriction,
  PaywallFeature,
  UpgradePrompt,
  PaywallTrigger,
  PromptFrequency
} from './service-list-types';

/**
 * Accessibility types
 * TypeScript interfaces for WCAG 2.1 AA compliance and screen reader support
 */
export type {
  AccessibilityConfig,
  FocusManagementConfig,
  AriaLabelsConfig
} from './service-list-types';

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

/**
 * Zod validation schemas
 * Runtime validation for service list parameters and inputs
 */
export {
  ServiceListFiltersSchema,
  ServiceListSortSchema,
  PaginationParamsSchema,
  BulkActionSchema,
  ServiceListQueryParamsSchema
} from './service-list-types';

/**
 * Zod inferred types
 * TypeScript types inferred from validation schemas
 */
export type {
  ServiceListFiltersInput,
  ServiceListSortInput,
  PaginationParamsInput,
  BulkActionInput,
  ServiceListQueryParamsInput
} from './service-list-types';

// =============================================================================
// QUERY KEY EXPORTS
// =============================================================================

/**
 * React Query cache keys
 * Standardized query keys for React Query cache management
 */
export {
  ServiceListQueryKeys
} from './service-list-types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Re-exported common enums and constants
 * Frequently used values for service list operations
 */
export type {
  FilterOperator,
  FilterFieldType,
  SortingState
} from './service-list-types';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export for convenient importing
 * Main service list container component as the primary interface
 */
export { default } from './service-list-container';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module version and compatibility information
 * Used for debugging and version tracking
 */
export const SERVICE_LIST_MODULE_VERSION = '1.0.0';
export const SERVICE_LIST_MODULE_COMPATABILITY = {
  react: '^19.0.0',
  typescript: '^5.8.0',
  nextjs: '^15.1.0'
};

/**
 * Module feature flags
 * Runtime feature detection for conditional functionality
 */
export const SERVICE_LIST_FEATURES = {
  VIRTUALIZATION: true,
  BULK_ACTIONS: true,
  REAL_TIME_UPDATES: true,
  ACCESSIBILITY: true,
  PAYWALL: true,
  EXPORT: true,
  ADVANCED_FILTERING: true,
  CONNECTION_TESTING: true
} as const;