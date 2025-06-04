'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { Search, Database, Table, ChevronRight, CheckSquare, Square, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Type imports for the component
interface TableMetadata {
  name: string;
  label?: string;
  description?: string;
  type: 'table' | 'view';
  rowCount?: number;
  primaryKey?: string[];
  fieldCount?: number;
}

interface SchemaData {
  tables: TableMetadata[];
  isLoading: boolean;
  error?: string;
}

interface TableSelectionProps {
  serviceId: string;
  selectedTables: string[];
  onTablesChange: (tables: string[]) => void;
  onNext?: () => void;
}

// Hook for schema discovery with React Query
const useSchemaDiscovery = (serviceId: string) => {
  return useQuery<TableMetadata[], Error>({
    queryKey: ['schema', serviceId, 'tables'],
    queryFn: async () => {
      if (!serviceId) {
        throw new Error('Service ID is required for schema discovery');
      }

      const response = await fetch(`/api/v2/system/service/${serviceId}/_schema`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300', // 5 minute cache
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to access this service.');
        }
        if (response.status === 404) {
          throw new Error('Service not found. Please verify the service configuration.');
        }
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to TableMetadata format
      const tables: TableMetadata[] = (data.resource || data.tables || []).map((table: any) => ({
        name: table.name,
        label: table.label || table.name,
        description: table.description,
        type: table.type || 'table',
        rowCount: table.record_count || table.rowCount,
        primaryKey: table.primary_key || table.primaryKey || [],
        fieldCount: table.field_count || table.fieldCount || table.field?.length || 0,
      }));

      // Sort tables by name for consistent display
      return tables.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Debounce hook for search optimization
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * TableSelection Component
 * 
 * First step of the API generation wizard that enables users to select database tables
 * for API generation. Features:
 * - Virtual scrolling for large schemas (1000+ tables)
 * - Real-time search with debouncing
 * - Multi-select functionality with batch operations
 * - React Query integration for intelligent caching
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA accessibility compliance
 */
export const TableSelection: React.FC<TableSelectionProps> = ({
  serviceId,
  selectedTables = [],
  onTablesChange,
  onNext,
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // Debounce search term for performance optimization
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Schema discovery with React Query
  const {
    data: tables = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSchemaDiscovery(serviceId);

  // Filter tables based on search term and selection filter
  const filteredTables = useMemo(() => {
    let filtered = tables;

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchLower) ||
        (table.label && table.label.toLowerCase().includes(searchLower)) ||
        (table.description && table.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply selection filter
    if (showOnlySelected) {
      filtered = filtered.filter(table => selectedTables.includes(table.name));
    }

    return filtered;
  }, [tables, debouncedSearchTerm, showOnlySelected, selectedTables]);

  // Virtual scrolling setup for large datasets
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: filteredTables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated height per row
    overscan: 10, // Render extra items for smooth scrolling
  });

  // Selection handlers
  const handleTableToggle = useCallback((tableName: string) => {
    const newSelection = selectedTables.includes(tableName)
      ? selectedTables.filter(name => name !== tableName)
      : [...selectedTables, tableName];
    
    onTablesChange(newSelection);
  }, [selectedTables, onTablesChange]);

  const handleSelectAll = useCallback(() => {
    const allTableNames = filteredTables.map(table => table.name);
    const allSelected = allTableNames.every(name => selectedTables.includes(name));
    
    if (allSelected) {
      // Deselect all filtered tables
      onTablesChange(selectedTables.filter(name => !allTableNames.includes(name)));
    } else {
      // Select all filtered tables
      const newSelection = [...new Set([...selectedTables, ...allTableNames])];
      onTablesChange(newSelection);
    }
  }, [filteredTables, selectedTables, onTablesChange]);

  const handleClearSelection = useCallback(() => {
    onTablesChange([]);
  }, [onTablesChange]);

  // Check if all filtered tables are selected
  const allFilteredSelected = useMemo(() => {
    return filteredTables.length > 0 && 
           filteredTables.every(table => selectedTables.includes(table.name));
  }, [filteredTables, selectedTables]);

  const someFilteredSelected = useMemo(() => {
    return filteredTables.some(table => selectedTables.includes(table.name));
  }, [filteredTables, selectedTables]);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Schema Discovery Failed
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Retry Schema Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Select Database Tables
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the database tables you want to generate REST API endpoints for. 
          You can search, filter, and select multiple tables at once.
        </p>
      </div>

      {/* Search and Controls Section */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables by name, label, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            aria-label="Search database tables"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Select All/None Button */}
            <button
              onClick={handleSelectAll}
              disabled={isLoading || filteredTables.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {allFilteredSelected ? (
                <CheckSquare className="h-4 w-4 mr-2" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>

            {/* Show Only Selected Toggle */}
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show only selected
              </span>
            </label>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {selectedTables.length} of {tables.length} tables selected
            </span>
            {selectedTables.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table List Section */}
      <div className="border border-gray-200 rounded-lg dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discovering database schema...
              </p>
            </div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Database className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {searchTerm ? 'No tables match your search' : 'No tables found'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search to see all tables.'
                  : 'This database service does not contain any accessible tables.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-96 overflow-auto"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const table = filteredTables[virtualItem.index];
                const isSelected = selectedTables.includes(table.name);

                return (
                  <div
                    key={table.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div
                      className={`
                        flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700 
                        hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      `}
                      onClick={() => handleTableToggle(table.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTableToggle(table.name);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} table ${table.name}`}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mr-3">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      {/* Table Icon */}
                      <div className="flex-shrink-0 mr-3">
                        <Table className="h-5 w-5 text-gray-400" />
                      </div>

                      {/* Table Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {table.label || table.name}
                          </h4>
                          {table.type === 'view' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              View
                            </span>
                          )}
                        </div>
                        {table.name !== table.label && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {table.name}
                          </p>
                        )}
                        {table.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                            {table.description}
                          </p>
                        )}
                      </div>

                      {/* Table Metadata */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {table.fieldCount !== undefined && (
                            <div>{table.fieldCount} fields</div>
                          )}
                          {table.rowCount !== undefined && (
                            <div>{table.rowCount.toLocaleString()} rows</div>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="flex-shrink-0 ml-3">
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      {selectedTables.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Ready to generate APIs
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected for API generation
              </p>
            </div>
            {onNext && (
              <button
                onClick={onNext}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Configuration
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSelection;