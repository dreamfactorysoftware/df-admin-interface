/**
 * CORS Configuration Table Component
 * 
 * React table component for displaying and managing CORS configuration entries,
 * implementing virtual scrolling for performance with large datasets. Provides 
 * CORS refresh functionality, delete operations, and real-time CORS status updates 
 * using SWR for intelligent caching and synchronization with comprehensive 
 * accessibility features.
 * 
 * Features:
 * - Data fetching with SWR/React Query for intelligent caching per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Virtual scrolling for large datasets per Section 7.6.2 performance optimization workflows
 * - WCAG 2.1 AA compliance per Section 7.6.4 accessibility requirements
 * - React Hook Form integration for form operations
 * - Comprehensive error handling and loading states
 * - Optimistic updates with rollback capabilities
 * - Keyboard navigation and screen reader support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { useCallback, useMemo, useState, useRef, useId, useTransition, startTransition } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCorsOperations } from './use-cors-operations';
import { cn } from '../../../lib/utils';

/**
 * CORS Configuration Data Interface
 * Represents a CORS configuration entry with all required fields
 */
interface CorsConfigData {
  id: number;
  path: string;
  description: string;
  enabled: boolean;
  origin: string;
  header: string;
  exposedHeader: string | null;
  maxAge: number;
  method: string[];
  supportsCredentials: boolean;
  createdById: number | null;
  createdDate: string | null;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
}

/**
 * Table column definition interface
 */
interface TableColumn {
  key: keyof CorsConfigData | 'actions';
  header: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  cell?: (value: any, row: CorsConfigData) => React.ReactNode;
  ariaLabel?: string;
}

/**
 * Sort configuration interface
 */
interface SortConfig {
  key: keyof CorsConfigData | null;
  direction: 'asc' | 'desc';
}

/**
 * Props for the CORS table component
 */
interface CorsTableProps {
  /**
   * Optional class name for styling
   */
  className?: string;
  
  /**
   * Callback when a CORS configuration is selected
   */
  onSelect?: (corsConfig: CorsConfigData) => void;
  
  /**
   * Callback when edit action is triggered
   */
  onEdit?: (corsConfig: CorsConfigData) => void;
  
  /**
   * Callback when view action is triggered
   */
  onView?: (corsConfig: CorsConfigData) => void;
  
  /**
   * Currently selected CORS configuration ID
   */
  selectedId?: number;
  
  /**
   * Enable bulk selection
   */
  enableBulkActions?: boolean;
  
  /**
   * Maximum height for the table container
   */
  maxHeight?: number;
  
  /**
   * Show loading overlay
   */
  showLoadingOverlay?: boolean;
  
  /**
   * Enable real-time updates
   */
  enableRealTimeUpdates?: boolean;
  
  /**
   * Table accessibility label
   */
  ariaLabel?: string;
}

/**
 * CORS Configuration Table Component
 * 
 * High-performance table component with virtual scrolling for managing
 * CORS configurations with comprehensive accessibility features and
 * intelligent caching through React Query.
 */
export function CorsTable({
  className,
  onSelect,
  onEdit,
  onView,
  selectedId,
  enableBulkActions = false,
  maxHeight = 600,
  showLoadingOverlay = false,
  enableRealTimeUpdates = true,
  ariaLabel = 'CORS configuration management table',
}: CorsTableProps) {
  // Hooks and state management
  const [isPending, startTransition] = useTransition();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Refs for virtualization and accessibility
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableId = useId();
  const captionId = useId();
  const announcementRef = useRef<HTMLDivElement>(null);
  
  // CORS operations hook with intelligent caching
  const {
    corsConfigurations,
    isLoadingList,
    isFetchingList,
    isErrorList,
    lastError,
    isAnyMutationLoading,
    deleteCors,
    bulkDeleteCors,
    refreshCorsConfigurations,
    isDeleting,
    isBulkDeleting,
    deleteError,
    bulkDeleteError,
  } = useCorsOperations({
    refetchOnFocus: enableRealTimeUpdates,
    optimisticUpdates: true,
    onError: (error) => {
      announceToScreenReader(`Error: ${error.message}`);
    },
    onSuccess: () => {
      announceToScreenReader('CORS configurations updated successfully');
    },
  });

  /**
   * Column definitions with accessibility enhancements
   */
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'enabled',
      header: 'Status',
      sortable: true,
      width: '80px',
      minWidth: '80px',
      ariaLabel: 'CORS configuration status',
      cell: (value: boolean) => (
        <div className="flex items-center justify-center">
          {value ? (
            <CheckCircleIcon 
              className="h-5 w-5 text-green-600 dark:text-green-400" 
              aria-label="Enabled"
            />
          ) : (
            <XCircleIcon 
              className="h-5 w-5 text-red-600 dark:text-red-400" 
              aria-label="Disabled"
            />
          )}
          <span className="sr-only">{value ? 'Enabled' : 'Disabled'}</span>
        </div>
      ),
    },
    {
      key: 'path',
      header: 'Path',
      sortable: true,
      minWidth: '150px',
      ariaLabel: 'CORS path pattern',
      cell: (value: string) => (
        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
          {value || '/'}
        </code>
      ),
    },
    {
      key: 'origin',
      header: 'Origin',
      sortable: true,
      minWidth: '180px',
      ariaLabel: 'Allowed origin domains',
      cell: (value: string) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {value || '*'}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Methods',
      sortable: false,
      minWidth: '120px',
      ariaLabel: 'Allowed HTTP methods',
      cell: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value?.length > 0 ? value.map((method) => (
            <span
              key={method}
              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-md font-medium"
            >
              {method}
            </span>
          )) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              None
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'maxAge',
      header: 'Max Age',
      sortable: true,
      width: '100px',
      minWidth: '100px',
      ariaLabel: 'Cache max age in seconds',
      cell: (value: number) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {value > 0 ? `${value}s` : '0'}
        </span>
      ),
    },
    {
      key: 'supportsCredentials',
      header: 'Credentials',
      sortable: true,
      width: '100px',
      minWidth: '100px',
      ariaLabel: 'Supports credentials',
      cell: (value: boolean) => (
        <div className="flex items-center justify-center">
          {value ? (
            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XMarkIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span className="sr-only">{value ? 'Supports credentials' : 'No credentials'}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      minWidth: '200px',
      ariaLabel: 'CORS configuration description',
      cell: (value: string) => (
        <span 
          className="text-sm text-gray-900 dark:text-gray-100 truncate block"
          title={value}
        >
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      width: '120px',
      minWidth: '120px',
      ariaLabel: 'Row actions',
      cell: (_, row: CorsConfigData) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onView?.(row)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={`View CORS configuration for ${row.path}`}
            data-testid={`view-cors-${row.id}`}
          >
            <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(row)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={`Edit CORS configuration for ${row.path}`}
            data-testid={`edit-cors-${row.id}`}
          >
            <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(row.id)}
            disabled={isDeleting}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
            aria-label={`Delete CORS configuration for ${row.path}`}
            data-testid={`delete-cors-${row.id}`}
          >
            <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      ),
    },
  ], [onView, onEdit, isDeleting]);

  /**
   * Filter and sort data based on search term and sort configuration
   */
  const filteredAndSortedData = useMemo(() => {
    let filtered = corsConfigurations;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = corsConfigurations.filter((cors) =>
        cors.path?.toLowerCase().includes(searchLower) ||
        cors.origin?.toLowerCase().includes(searchLower) ||
        cors.description?.toLowerCase().includes(searchLower) ||
        cors.method?.some(m => m.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }

    return filtered;
  }, [corsConfigurations, searchTerm, sortConfig]);

  /**
   * Virtual scrolling setup for performance with large datasets
   */
  const virtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56, // Estimated row height in pixels
    overscan: 10, // Render extra items for smooth scrolling
  });

  /**
   * Handle column sorting with accessibility announcements
   */
  const handleSort = useCallback((columnKey: keyof CorsConfigData) => {
    startTransition(() => {
      setSortConfig(prev => {
        const newDirection = prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc';
        const newConfig = { key: columnKey, direction: newDirection };
        
        announceToScreenReader(
          `Table sorted by ${columnKey} in ${newDirection}ending order. ${filteredAndSortedData.length} rows displayed.`
        );
        
        return newConfig;
      });
    });
  }, [filteredAndSortedData.length]);

  /**
   * Handle row selection for bulk operations
   */
  const handleRowSelect = useCallback((corsId: number, selected: boolean) => {
    startTransition(() => {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(corsId);
        } else {
          newSet.delete(corsId);
        }
        
        announceToScreenReader(
          `Row ${selected ? 'selected' : 'deselected'}. ${newSet.size} of ${filteredAndSortedData.length} rows selected.`
        );
        
        return newSet;
      });
    });
  }, [filteredAndSortedData.length]);

  /**
   * Handle bulk selection (select all/none)
   */
  const handleBulkSelect = useCallback((selectAll: boolean) => {
    startTransition(() => {
      if (selectAll) {
        const allIds = new Set(filteredAndSortedData.map(cors => cors.id));
        setSelectedRows(allIds);
        announceToScreenReader(`All ${allIds.size} rows selected.`);
      } else {
        setSelectedRows(new Set());
        announceToScreenReader('All rows deselected.');
      }
    });
  }, [filteredAndSortedData]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteClick = useCallback((corsId: number) => {
    setShowDeleteConfirm(corsId);
    announceToScreenReader('Delete confirmation dialog opened.');
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async (corsId: number) => {
    try {
      await deleteCors(corsId);
      setShowDeleteConfirm(null);
      announceToScreenReader('CORS configuration deleted successfully.');
    } catch (error) {
      announceToScreenReader(`Failed to delete CORS configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deleteCors]);

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.size === 0) return;
    
    try {
      await bulkDeleteCors(Array.from(selectedRows));
      setSelectedRows(new Set());
      announceToScreenReader(`${selectedRows.size} CORS configurations deleted successfully.`);
    } catch (error) {
      announceToScreenReader(`Failed to delete CORS configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [bulkDeleteCors, selectedRows]);

  /**
   * Handle search input
   */
  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      setSearchTerm(value);
      announceToScreenReader(
        value 
          ? `Filtering CORS configurations by "${value}". ${filteredAndSortedData.length} results found.`
          : 'Search filter cleared. Showing all CORS configurations.'
      );
    });
  }, [filteredAndSortedData.length]);

  /**
   * Handle refresh action
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refreshCorsConfigurations();
      announceToScreenReader('CORS configurations refreshed successfully.');
    } catch (error) {
      announceToScreenReader(`Failed to refresh CORS configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [refreshCorsConfigurations]);

  /**
   * Screen reader announcements utility
   */
  const announceToScreenReader = useCallback((message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, []);

  /**
   * Keyboard navigation handler
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (rowIndex < filteredAndSortedData.length - 1) {
          const nextRow = tableContainerRef.current?.querySelector(
            `[data-row-index="${rowIndex + 1}"]`
          ) as HTMLElement;
          nextRow?.focus();
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (rowIndex > 0) {
          const prevRow = tableContainerRef.current?.querySelector(
            `[data-row-index="${rowIndex - 1}"]`
          ) as HTMLElement;
          prevRow?.focus();
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        const corsConfig = filteredAndSortedData[rowIndex];
        if (corsConfig) {
          onSelect?.(corsConfig);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        const firstRow = tableContainerRef.current?.querySelector(
          '[data-row-index="0"]'
        ) as HTMLElement;
        firstRow?.focus();
        break;
        
      case 'End':
        event.preventDefault();
        const lastRow = tableContainerRef.current?.querySelector(
          `[data-row-index="${filteredAndSortedData.length - 1}"]`
        ) as HTMLElement;
        lastRow?.focus();
        break;
    }
  }, [filteredAndSortedData, onSelect]);

  // Loading state
  if (isLoadingList && corsConfigurations.length === 0) {
    return (
      <div 
        className={cn("space-y-4 p-6", className)}
        data-testid="cors-table-loading"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isErrorList && corsConfigurations.length === 0) {
    return (
      <div 
        className={cn("p-6 text-center", className)}
        data-testid="cors-table-error"
        role="alert"
        aria-live="polite"
      >
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load CORS Configurations
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {lastError?.message || 'An unexpected error occurred while loading CORS configurations.'}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isFetchingList}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="retry-load-cors"
        >
          {isFetchingList ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={cn("flex flex-col h-full", className)}
      data-testid="cors-table-container"
    >
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Search and Filter Controls */}
        <div className="flex-1 max-w-md">
          <label htmlFor="cors-search" className="sr-only">
            Search CORS configurations
          </label>
          <input
            id="cors-search"
            type="text"
            placeholder="Search by path, origin, or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            data-testid="cors-search-input"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {enableBulkActions && selectedRows.size > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRows.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                data-testid="bulk-delete-cors"
                aria-label={`Delete ${selectedRows.size} selected CORS configurations`}
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isFetchingList}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh CORS configurations"
            data-testid="refresh-cors-list"
          >
            <ArrowPathIcon 
              className={cn(
                "h-5 w-5 text-gray-600 dark:text-gray-400",
                isFetchingList && "animate-spin"
              )} 
            />
          </button>

          {/* Status Indicator */}
          {(isFetchingList || isAnyMutationLoading) && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              {isFetchingList ? 'Refreshing...' : 'Updating...'}
            </div>
          )}
        </div>
      </div>

      {/* Table Stats */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span data-testid="cors-table-stats">
            {filteredAndSortedData.length} of {corsConfigurations.length} CORS configurations
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
          {enableBulkActions && (
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                  onChange={(e) => handleBulkSelect(e.target.checked)}
                  className="mr-2 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  aria-label="Select all visible CORS configurations"
                  data-testid="select-all-cors"
                />
                Select All
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Table Container with Virtual Scrolling */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto"
        style={{ maxHeight }}
        data-testid="cors-table-scroll-container"
      >
        {filteredAndSortedData.length === 0 ? (
          <div className="p-8 text-center">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No CORS Configurations Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? `No CORS configurations match "${searchTerm}". Try adjusting your search terms.`
                : 'No CORS configurations have been created yet.'
              }
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Table Header */}
            <div
              className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              role="rowgroup"
            >
              <div className="flex" role="row">
                {enableBulkActions && (
                  <div 
                    className="flex items-center justify-center px-4 py-3 w-12 min-w-[48px]"
                    role="columnheader"
                  >
                    <span className="sr-only">Select</span>
                  </div>
                )}
                
                {columns.map((column) => (
                  <div
                    key={column.key}
                    role="columnheader"
                    scope="col"
                    aria-sort={
                      sortConfig.key === column.key 
                        ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                        : column.sortable ? 'none' : undefined
                    }
                    className={cn(
                      "flex items-center px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                      column.width && `w-[${column.width}]`,
                      column.minWidth && `min-w-[${column.minWidth}]`,
                      !column.width && !column.minWidth && "flex-1"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    onClick={column.sortable ? () => handleSort(column.key as keyof CorsConfigData) : undefined}
                    tabIndex={column.sortable ? 0 : undefined}
                    onKeyDown={column.sortable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(column.key as keyof CorsConfigData);
                      }
                    } : undefined}
                    aria-label={column.ariaLabel}
                  >
                    <span>{column.header}</span>
                    {column.sortable && (
                      <ChevronUpDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Virtual Table Rows */}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const corsConfig = filteredAndSortedData[virtualRow.index];
              const isSelected = selectedRows.has(corsConfig.id);
              
              return (
                <div
                  key={corsConfig.id}
                  data-row-index={virtualRow.index}
                  role="row"
                  aria-selected={isSelected}
                  tabIndex={0}
                  className={cn(
                    "absolute top-0 left-0 w-full flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-primary-50 dark:focus:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors",
                    selectedId === corsConfig.id && "bg-primary-50 dark:bg-primary-900/20",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onSelect?.(corsConfig)}
                  onKeyDown={(e) => handleKeyDown(e, virtualRow.index)}
                  data-testid={`cors-row-${corsConfig.id}`}
                >
                  {enableBulkActions && (
                    <div className="flex items-center justify-center px-4 w-12 min-w-[48px]" role="gridcell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(corsConfig.id, e.target.checked);
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select CORS configuration for ${corsConfig.path}`}
                        data-testid={`select-cors-${corsConfig.id}`}
                      />
                    </div>
                  )}
                  
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      role="gridcell"
                      className={cn(
                        "px-4 py-3 text-sm",
                        column.width && `w-[${column.width}]`,
                        column.minWidth && `min-w-[${column.minWidth}]`,
                        !column.width && !column.minWidth && "flex-1"
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                      }}
                    >
                      {column.cell 
                        ? column.cell(corsConfig[column.key as keyof CorsConfigData], corsConfig)
                        : String(corsConfig[column.key as keyof CorsConfigData] || '')
                      }
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          data-testid="delete-confirmation-dialog"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 
              id="delete-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              Delete CORS Configuration
            </h3>
            <p 
              id="delete-dialog-description"
              className="text-gray-600 dark:text-gray-400 mb-6"
            >
              Are you sure you want to delete this CORS configuration? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                data-testid="cancel-delete-cors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="confirm-delete-cors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="screen-reader-announcements"
      />

      {/* Table Caption for Screen Readers */}
      <div className="sr-only">
        <p id={captionId}>
          {ariaLabel}. Use arrow keys to navigate between rows. Press Enter or Space to select a row.
          {filteredAndSortedData.length > 0 && ` Currently showing ${filteredAndSortedData.length} CORS configurations.`}
          {selectedRows.size > 0 && ` ${selectedRows.size} rows selected.`}
        </p>
      </div>

      {/* Loading Overlay */}
      {showLoadingOverlay && isAnyMutationLoading && (
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-40"
          data-testid="loading-overlay"
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-gray-900 dark:text-gray-100">
              {isDeleting ? 'Deleting CORS configuration...' : 
               isBulkDeleting ? 'Deleting CORS configurations...' : 
               'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorsTable;