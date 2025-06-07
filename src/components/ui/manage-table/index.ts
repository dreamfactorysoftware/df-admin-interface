/**
 * ManageTable Component System - Main Export File
 * 
 * Centralizes all table-related exports for the DreamFactory Admin Interface
 * manage-table component system following React 19/Next.js 15.1 conventions.
 * 
 * This barrel export provides clean imports for ManageTable component and
 * related types, ensuring consistent usage across the application while
 * maintaining TypeScript 5.8+ type safety and modern React patterns.
 * 
 * Key Features:
 * - React 19 component system with comprehensive type definitions
 * - TanStack Table integration with React Query data fetching
 * - WCAG 2.1 AA accessibility compliance with keyboard navigation
 * - Tailwind CSS styling variants with CVA implementation
 * - Clean export patterns for Next.js 15.1 app router compatibility
 * 
 * @fileoverview Main export file for manage-table component system
 * @version 1.0.0
 */

// =============================================================================
// Component Exports
// =============================================================================

/**
 * Main ManageTable component - both default and named export
 * 
 * Comprehensive React 19 data table component replacing Angular df-manage-table.
 * Implements TanStack Table for table logic, TanStack React Query for data fetching,
 * TanStack Virtual for performance optimization, and maintains WCAG 2.1 AA accessibility.
 */
export { ManageTable, ManageTable as default } from './manage-table';

// =============================================================================
// Core Type Definitions
// =============================================================================

/**
 * Primary component interface exports
 * Core types required for ManageTable component usage
 */
export type {
  ManageTableProps,
  ManageTableRef,
  ManageTableColumnDef,
} from './manage-table.types';

/**
 * Component context and hook types
 * Advanced typing for component composition patterns
 */
export type {
  ManageTableContext,
  UseManageTableReturn,
  UseTableStateOptions,
} from './manage-table.types';

// =============================================================================
// API Integration Types
// =============================================================================

/**
 * Data fetching and API integration types
 * React Query integration with DreamFactory REST API conventions
 */
export type {
  TableApiResponse,
  TableDataFetchConfig,
  TableQueryParams,
} from './manage-table.types';

// =============================================================================
// Configuration Interface Exports
// =============================================================================

/**
 * Feature configuration interfaces
 * Comprehensive configuration options for table functionality
 */
export type {
  PaginationConfig,
  InfiniteScrollConfig,
  VirtualizationConfig,
  SortingConfig,
  GlobalFilterConfig,
  ColumnFilterConfig,
  RowSelectionConfig,
  ColumnVisibilityConfig,
  ColumnGroupConfig,
} from './manage-table.types';

/**
 * State management configuration types
 * Table state persistence and controlled/uncontrolled patterns
 */
export type {
  TableStateConfig,
  TablePersistenceConfig,
} from './manage-table.types';

/**
 * Theme and styling configuration types
 * Visual customization and responsive behavior options
 */
export type {
  TableThemeConfig,
  ResponsiveTableConfig,
} from './manage-table.types';

/**
 * Form integration configuration types
 * Inline editing and form validation support
 */
export type {
  TableFormConfig,
} from './manage-table.types';

// =============================================================================
// Action System Types
// =============================================================================

/**
 * Action configuration interfaces
 * Row actions, bulk actions, and table-level actions
 */
export type {
  RowAction,
  BulkAction,
} from './manage-table.types';

// =============================================================================
// Utility and Analytics Types
// =============================================================================

/**
 * Export and analytics interfaces
 * Data export functionality and performance monitoring
 */
export type {
  TableExportConfig,
  TableAnalytics,
} from './manage-table.types';

// =============================================================================
// Styling Variant Exports
// =============================================================================

/**
 * Class variance authority (CVA) variant functions
 * WCAG 2.1 AA compliant styling utilities with semantic color scales
 */
export {
  tableContainerVariants,
  tableVariants,
  tableHeaderVariants,
  tableCellVariants,
  statusBadgeVariants,
  tableActionVariants,
} from './manage-table-variants';

/**
 * Utility functions for combining table variants
 * Helper functions for responsive behavior and accessibility features
 */
export {
  createTableContainer,
  createTable,
  createTableHeader,
  createTableCell,
  createStatusBadge,
  createTableAction,
} from './manage-table-variants';

/**
 * Variant type definitions
 * TypeScript support with autocompletion for all table variant configurations
 */
export type {
  TableContainerVariants,
  TableVariants,
  TableHeaderVariants,
  TableCellVariants,
  StatusBadgeVariants,
  TableActionVariants,
} from './manage-table-variants';

/**
 * Pre-configured variant combinations and accessibility utilities
 * Common table configurations following DreamFactory design system patterns
 */
export {
  tablePresets,
  tableA11yUtils,
} from './manage-table-variants';

// =============================================================================
// Re-exports for Convenience
// =============================================================================

/**
 * Commonly used external types for convenience
 * Re-exports from TanStack Table for easier consumption
 */
export type {
  ColumnDef,
  Table,
  Column,
  Row,
  Cell,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  VisibilityState,
  ColumnOrderState,
} from '@tanstack/react-table';

/**
 * React Query types for data fetching integration
 * Re-exports for table data management patterns
 */
export type {
  UseQueryResult,
  UseInfiniteQueryResult,
  QueryKey,
} from '@tanstack/react-query';

/**
 * Virtualization types for performance optimization
 * Re-exports from TanStack Virtual for large dataset handling
 */
export type {
  Virtualizer,
} from '@tanstack/react-virtual';

// =============================================================================
// Component System Documentation
// =============================================================================

/**
 * @example Basic ManageTable Usage
 * ```tsx
 * import { ManageTable, type ManageTableProps, type ManageTableColumnDef } from '@/components/ui/manage-table';
 * 
 * const columns: ManageTableColumnDef<User>[] = [
 *   {
 *     id: 'name',
 *     header: 'Name',
 *     accessorKey: 'name',
 *     enableSorting: true,
 *   },
 *   {
 *     id: 'email',
 *     header: 'Email',
 *     accessorKey: 'email',
 *     enableSorting: true,
 *   },
 * ];
 * 
 * function UsersTable() {
 *   return (
 *     <ManageTable
 *       data={users}
 *       columns={columns}
 *       pagination={{
 *         enabled: true,
 *         defaultPageSize: 10,
 *         pageSizeOptions: [10, 25, 50],
 *       }}
 *       sorting={{
 *         enabled: true,
 *         enableMultiSort: false,
 *       }}
 *       globalFilter={{
 *         enabled: true,
 *         placeholder: 'Search users...',
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Advanced Usage with React Query
 * ```tsx
 * import { ManageTable, type TableDataFetchConfig } from '@/components/ui/manage-table';
 * import { useQuery } from '@tanstack/react-query';
 * 
 * function DatabaseTablesTable() {
 *   const dataFetch: TableDataFetchConfig = {
 *     queryKey: ['database-tables', 'service-id'],
 *     queryFn: async (params) => {
 *       const response = await fetch('/api/v2/database/_table', {
 *         params: {
 *           limit: params.limit,
 *           offset: params.offset,
 *           filter: params.search ? `name contains "${params.search}"` : undefined,
 *         },
 *       });
 *       return response.json();
 *     },
 *     staleTime: 300_000, // 5 minutes for schema data
 *   };
 * 
 *   return (
 *     <ManageTable
 *       dataFetch={dataFetch}
 *       columns={tableColumns}
 *       virtualization={{
 *         enabled: true,
 *         estimateSize: 50,
 *         overscan: 10,
 *       }}
 *       rowActions={[
 *         {
 *           id: 'view-schema',
 *           label: 'View Schema',
 *           icon: <Eye className="h-4 w-4" />,
 *           onClick: (row) => router.push(`/schema/${row.original.name}`),
 *         },
 *         {
 *           id: 'generate-api',
 *           label: 'Generate API',
 *           icon: <Plus className="h-4 w-4" />,
 *           onClick: (row) => router.push(`/api-generation/${row.original.name}`),
 *         },
 *       ]}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Custom Styling with Variants
 * ```tsx
 * import { ManageTable, createTableContainer, tablePresets } from '@/components/ui/manage-table';
 * 
 * function CompactDataTable() {
 *   return (
 *     <div className={createTableContainer(tablePresets.compact.container)}>
 *       <ManageTable
 *         data={data}
 *         columns={columns}
 *         theme={tablePresets.compact.container}
 *         className="custom-table-styles"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */