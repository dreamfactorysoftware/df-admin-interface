/**
 * @fileoverview Main export file for the manage-table component system
 * 
 * Provides clean imports for ManageTable component and related types following
 * React 19/Next.js 15.1 conventions. Centralizes all table-related exports for
 * consistent usage across the application.
 * 
 * @version 1.0.0
 * @author DreamFactory Team
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// Core component exports - main ManageTable component with forwardRef support
export { default, ManageTable } from './manage-table';

// Type definitions and interfaces for external consumption
export type {
  // Core component types
  ManageTableProps,
  ManageTableRef,
  
  // Column configuration types
  ColumnDef,
  ColumnDefBase,
  AccessorColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
  
  // Table data and row types
  TableData,
  RowData,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  
  // Action configuration types
  RowAction,
  RowActionConfig,
  BulkAction,
  BulkActionConfig,
  ActionMenuProps,
  
  // Filtering and sorting types
  FilterFn,
  SortingFn,
  GlobalFilterState,
  ColumnFilter,
  ColumnSort,
  
  // Pagination types
  PaginationConfig,
  PaginationMode,
  PaginationInfo,
  
  // Theme and styling types
  TableTheme,
  TableDensity,
  TableVariant,
  TableSize,
  
  // Accessibility types
  AccessibilityProps,
  AriaConfig,
  KeyboardConfig,
  
  // Performance types
  VirtualizationConfig,
  PerformanceConfig,
  CacheConfig,
  
  // Integration types
  ReactQueryConfig,
  TanStackTableConfig,
  FormIntegrationConfig,
  
  // Event handler types
  TableEventHandlers,
  CellEventHandlers,
  RowEventHandlers,
  HeaderEventHandlers,
  
  // Selection types
  SelectionConfig,
  SelectionMode,
  SelectionState,
  
  // Loading and state types
  LoadingState,
  ErrorState,
  EmptyState,
  TableState,
  
  // Column resizing and ordering types
  ColumnResizing,
  ColumnOrdering,
  ColumnVisibility,
  
  // Export and data manipulation types
  ExportConfig,
  DataFormat,
  ExportOptions,
  
  // Custom cell renderer types
  CellRenderer,
  CellContext,
  HeaderRenderer,
  HeaderContext,
} from './manage-table.types';

// Variant utilities and styling functions
export {
  // Core variant generators
  tableVariants,
  tableHeaderVariants,
  tableCellVariants,
  tableRowVariants,
  
  // Size and density variants
  tableSizeVariants,
  tableDensityVariants,
  
  // Theme and state variants
  tableThemeVariants,
  tableStateVariants,
  
  // Interactive state variants
  hoverVariants,
  focusVariants,
  selectionVariants,
  
  // Accessibility variants
  accessibilityVariants,
  focusRingVariants,
  
  // Color and contrast variants
  colorVariants,
  contrastVariants,
  
  // Border and spacing variants
  borderVariants,
  spacingVariants,
  
  // Animation variants
  animationVariants,
  transitionVariants,
  
  // Responsive variants
  responsiveVariants,
  breakpointVariants,
  
  // Utility functions
  createTableTheme,
  mergeTableClasses,
  generateTableId,
  getTableAriaProps,
  
  // Type guards and validators
  isValidTableData,
  isValidColumnDef,
  isValidRowAction,
  
  // Default configurations
  DEFAULT_TABLE_CONFIG,
  DEFAULT_PAGINATION_CONFIG,
  DEFAULT_VIRTUALIZATION_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from './manage-table-variants';

// Re-export commonly used utilities for convenience
export {
  type ClassValue,
  cn,
} from '@/lib/utils';

/**
 * Version information for the manage-table component system
 */
export const MANAGE_TABLE_VERSION = '1.0.0' as const;

/**
 * Component metadata for development and debugging
 */
export const MANAGE_TABLE_METADATA = {
  name: 'ManageTable',
  version: MANAGE_TABLE_VERSION,
  dependencies: {
    react: '^19.0.0',
    'next': '^15.1.0',
    '@tanstack/react-table': '^8.11.0',
    '@tanstack/react-virtual': '^3.0.0',
    '@tanstack/react-query': '^5.0.0',
    'react-hook-form': '^7.52.0',
    'tailwindcss': '^4.1.0',
    '@headlessui/react': '^2.0.0',
  },
  features: [
    'TanStack Table integration',
    'TanStack Virtual for performance',
    'React Query data fetching',
    'WCAG 2.1 AA accessibility',
    'Responsive design',
    'Dark/light theme support',
    'Keyboard navigation',
    'Screen reader support',
    'Large dataset handling (1000+ rows)',
    'Real-time filtering and sorting',
    'Bulk operations',
    'Custom cell renderers',
    'Export functionality',
  ],
  performance: {
    maxRows: 1000,
    cacheTime: 300, // seconds
    virtualization: true,
    lazyLoading: true,
  },
  accessibility: {
    wcag: '2.1 AA',
    keyboardNavigation: true,
    screenReader: true,
    highContrast: true,
    reducedMotion: true,
  },
} as const;