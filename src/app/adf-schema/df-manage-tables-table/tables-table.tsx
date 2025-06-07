'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useTableSchemas } from '@/hooks/use-table-schemas';
import type { SchemaTable } from '@/types/schema';
import { useAppStore } from '@/stores/app-store';
import { 
  TrashIcon, 
  EyeIcon, 
  PlusIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { EyeIcon as EyeIconSolid } from '@heroicons/react/24/solid';

/**
 * Props interface for the TablesTable component
 */
export interface TablesTableProps {
  /**
   * Optional service name override (defaults to route parameter)
   */
  serviceName?: string;
  
  /**
   * Enable table creation functionality
   */
  allowCreate?: boolean;
  
  /**
   * Enable search/filter functionality  
   */
  allowFilter?: boolean;
  
  /**
   * Enable refresh functionality
   */
  allowRefresh?: boolean;
  
  /**
   * Custom page size for pagination
   */
  pageSize?: number;
  
  /**
   * Enable virtual scrolling for large datasets
   */
  enableVirtualScrolling?: boolean;
  
  /**
   * Custom row height for virtual scrolling optimization
   */
  rowHeight?: number;
  
  /**
   * Callback when table is created/edited
   */
  onTableAction?: (action: 'create' | 'edit' | 'delete', tableName?: string) => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Table row data interface matching the Angular DatabaseTableRowData type
 */
export interface TableRowData {
  id: string;
  name: string;
  label: string;
  description?: string;
  isView?: boolean;
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
}

/**
 * Enhanced database table schema management component optimized for React/Next.js architecture.
 * 
 * Provides high-performance table display and management capabilities for database schemas
 * with TanStack Virtual integration for datasets containing 1000+ tables. Features React Query
 * intelligent caching with 5-minute stale time and 15-minute cache duration for optimal
 * performance per Section 5.2 Component Details.
 * 
 * Key Features:
 * - TanStack Virtual scrolling for enterprise-scale database schemas
 * - React Query caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Headless UI components with Tailwind CSS styling
 * - Next.js routing integration for navigation
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Real-time search filtering with debounced input
 * - Accessible table interactions with WCAG 2.1 AA compliance
 * 
 * Performance Optimizations:
 * - Virtual scrolling with configurable row height (default: 48px)
 * - Progressive loading for large datasets
 * - Intelligent caching and background refresh
 * - Memory-efficient rendering of visible rows only
 * 
 * @param props - Component configuration options
 * @returns Optimized database table schema management interface
 */
export function TablesTable({
  serviceName: propServiceName,
  allowCreate = true,
  allowFilter = true,
  allowRefresh = true,
  pageSize = 50,
  enableVirtualScrolling = true,
  rowHeight = 48,
  onTableAction,
  className = '',
}: TablesTableProps) {
  // Next.js routing hooks
  const router = useRouter();
  const params = useParams();
  
  // Extract database name from route parameters
  const databaseName = propServiceName || (params?.name as string);
  
  // Local state management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Global state for preferences and theming
  const { preferences, theme } = useAppStore();
  
  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  // React Query hook for table schemas with optimized caching
  const {
    tables,
    filteredTables,
    isLoading,
    isError,
    error,
    refetch,
    refresh,
    totalTables,
    loadedTables,
    cacheHitRate,
    lastFetchTime,
    setTableFilter,
    getTableDetails,
    selectTable,
  } = useTableSchemas({
    serviceName: databaseName,
    enableProgressiveLoading: true,
    enableVirtualScrolling,
    pageSize,
    tableFilter: searchQuery,
    includeViews: true,
    prefetchDetails: false,
    cacheConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes (300 seconds) per requirements
      cacheTime: 15 * 60 * 1000, // 15 minutes (900 seconds) per requirements
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: 1000,
    },
  });
  
  // Map schema tables to table row data format
  const tableRowData = useMemo((): TableRowData[] => {
    return filteredTables.map((table: SchemaTable) => ({
      id: table.name,
      name: table.name,
      label: table.label || table.name,
      description: table.description,
      isView: table.isView,
      rowCount: table.rowCount,
      estimatedSize: table.estimatedSize,
      lastModified: table.lastModified,
    }));
  }, [filteredTables]);
  
  // TanStack Virtual configuration for performance optimization
  const rowVirtualizer = useVirtualizer({
    count: tableRowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10, // Render 10 additional rows outside viewport for smooth scrolling
    enabled: enableVirtualScrolling && tableRowData.length > 100, // Only enable for large datasets
  });
  
  // Virtual items for efficient rendering
  const virtualItems = rowVirtualizer.getVirtualItems();
  
  // Handle search input with debouncing via the hook
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setTableFilter(value);
  }, [setTableFilter]);
  
  // Navigation handlers
  const handleCreateTable = useCallback(() => {
    router.push(`/adf-schema/df-table-details/create?service=${databaseName}`);
    onTableAction?.('create');
  }, [router, databaseName, onTableAction]);
  
  const handleViewTable = useCallback((tableName: string) => {
    router.push(`/adf-schema/df-table-details/${tableName}?service=${databaseName}`);
    onTableAction?.('edit', tableName);
  }, [router, databaseName, onTableAction]);
  
  const handleDeleteTable = useCallback(async (tableName: string) => {
    if (window.confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      try {
        // Call the API to delete the table schema
        const response = await fetch(`/api/v2/db/${databaseName}/_schema/${tableName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete table: ${response.statusText}`);
        }
        
        // Refresh the table data after successful deletion
        await refresh();
        onTableAction?.('delete', tableName);
      } catch (error) {
        console.error('Error deleting table:', error);
        // In a real app, you'd show a proper error notification
        alert(`Failed to delete table: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [databaseName, refresh, onTableAction]);
  
  const handleRefreshSchema = useCallback(() => {
    refresh();
  }, [refresh]);
  
  // Row selection handlers
  const handleRowSelect = useCallback((tableName: string, multiSelect = false) => {
    if (multiSelect) {
      const newSelection = new Set(selectedRows);
      if (newSelection.has(tableName)) {
        newSelection.delete(tableName);
      } else {
        newSelection.add(tableName);
      }
      setSelectedRows(newSelection);
    } else {
      setSelectedRows(new Set([tableName]));
    }
    selectTable(tableName, multiSelect);
  }, [selectedRows, selectTable]);
  
  const handleRowClick = useCallback((tableName: string, event: React.MouseEvent) => {
    const isMetaKey = event.metaKey || event.ctrlKey;
    const isShiftKey = event.shiftKey;
    
    if (isMetaKey || isShiftKey) {
      handleRowSelect(tableName, true);
    } else {
      handleViewTable(tableName);
    }
  }, [handleRowSelect, handleViewTable]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent, tableName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleViewTable(tableName);
    }
  }, [handleViewTable]);
  
  // Error state rendering
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600 dark:text-red-400">
        <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
        <div>
          <h3 className="text-lg font-semibold">Error loading database tables</h3>
          <p className="text-sm mt-1">
            {error?.message || 'Failed to load database schema information'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {allowCreate && (
            <button
              onClick={handleCreateTable}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Create new table"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Table
            </button>
          )}
          
          {allowRefresh && (
            <button
              onClick={handleRefreshSchema}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              aria-label="Refresh schema"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Performance metrics display */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalTables > 0 && (
              <span>
                {loadedTables.toLocaleString()} of {totalTables.toLocaleString()} tables
                {cacheHitRate > 0 && (
                  <span className="ml-2">
                    Cache: {(cacheHitRate * 100).toFixed(1)}%
                  </span>
                )}
              </span>
            )}
          </div>
          
          {allowFilter && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search tables..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                aria-label="Search tables"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Table Container */}
      <div className="relative">
        {isLoading && tableRowData.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading database tables...</p>
            </div>
          </div>
        ) : tableRowData.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tables found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 
                  `No tables match "${searchQuery}"` : 
                  'This database contains no tables'
                }
              </p>
              {allowCreate && !searchQuery && (
                <button
                  onClick={handleCreateTable}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Table
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-6">Table Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Rows</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            
            {/* Virtual Scrolling Container */}
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{
                height: enableVirtualScrolling && tableRowData.length > 100 ? '600px' : 'auto',
                maxHeight: '600px',
              }}
            >
              {enableVirtualScrolling && tableRowData.length > 100 ? (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualItem) => {
                    const row = tableRowData[virtualItem.index];
                    const isSelected = selectedRows.has(row.name);
                    
                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <TableRow
                          row={row}
                          isSelected={isSelected}
                          onRowClick={handleRowClick}
                          onViewTable={handleViewTable}
                          onDeleteTable={handleDeleteTable}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {tableRowData.map((row) => {
                    const isSelected = selectedRows.has(row.name);
                    
                    return (
                      <TableRow
                        key={row.id}
                        row={row}
                        isSelected={isSelected}
                        onRowClick={handleRowClick}
                        onViewTable={handleViewTable}
                        onDeleteTable={handleDeleteTable}
                        onKeyDown={handleKeyDown}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Info Bar */}
      {tableRowData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Showing {tableRowData.length} of {totalTables} tables
              {searchQuery && (
                <span className="ml-2">
                  (filtered by "{searchQuery}")
                </span>
              )}
            </div>
            <div>
              {lastFetchTime > 0 && (
                <span>
                  Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual table row component for optimized rendering
 */
interface TableRowProps {
  row: TableRowData;
  isSelected: boolean;
  onRowClick: (tableName: string, event: React.MouseEvent) => void;
  onViewTable: (tableName: string) => void;
  onDeleteTable: (tableName: string) => void;
  onKeyDown: (event: React.KeyboardEvent, tableName: string) => void;
}

function TableRow({
  row,
  isSelected,
  onRowClick,
  onViewTable,
  onDeleteTable,
  onKeyDown,
}: TableRowProps) {
  return (
    <div
      className={`
        px-6 py-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/20
      `}
      tabIndex={0}
      onClick={(e) => onRowClick(row.name, e)}
      onKeyDown={(e) => onKeyDown(e, row.name)}
      role="button"
      aria-label={`View table ${row.label}`}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Table Name */}
        <div className="col-span-6">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {row.label}
              </div>
              {row.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {row.description}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Table Type */}
        <div className="col-span-2">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${row.isView ? 
              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' : 
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            }
          `}>
            {row.isView ? 'View' : 'Table'}
          </span>
        </div>
        
        {/* Row Count */}
        <div className="col-span-2">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {row.rowCount !== undefined ? row.rowCount.toLocaleString() : '-'}
          </div>
          {row.estimatedSize && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.estimatedSize}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="col-span-2">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewTable(row.name);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={`View table ${row.label}`}
            >
              <EyeIconSolid className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTable(row.name);
              }}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label={`Delete table ${row.label}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TablesTable;