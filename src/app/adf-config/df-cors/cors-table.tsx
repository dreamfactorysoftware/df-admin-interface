/**
 * CORS Configuration Table Component
 * 
 * React table component for displaying and managing CORS configuration entries,
 * implementing virtual scrolling for performance with large datasets. Provides
 * CORS refresh functionality, delete operations, and real-time CORS status updates
 * using SWR for intelligent caching and synchronization with comprehensive
 * accessibility features.
 * 
 * Replaces Angular DfManageCorsTableComponent with modern React 19/Next.js 15.1+
 * implementation using Headless UI table patterns and Tailwind CSS styling.
 * 
 * @fileoverview CORS configuration table with virtual scrolling and accessibility
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { 
  useState, 
  useCallback, 
  useMemo, 
  useId, 
  useRef,
  useEffect,
  startTransition,
  forwardRef,
  KeyboardEvent
} from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  RefreshCw, 
  Trash2, 
  Edit,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
import { 
  useCorsOperations,
  useCorsList,
  useCorsDelete,
  useCorsToggle,
  type CorsConfig,
  type CorsConfigQuery,
  type CorsConfigSort 
} from './use-cors-operations';
import type { CorsConfig as CorsConfigType } from '../../../types/cors';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Props for the main CORS table component
 */
export interface CorsTableProps {
  /**
   * Optional external data for testing/storybook
   * When provided, disables internal data fetching
   */
  data?: CorsConfig[];
  
  /**
   * Whether to show the create button
   * Defaults to true
   */
  allowCreate?: boolean;
  
  /**
   * Whether to show the filter/search functionality
   * Defaults to true
   */
  allowFilter?: boolean;
  
  /**
   * Initial page size for the table
   * Defaults to 25
   */
  initialPageSize?: number;
  
  /**
   * Callback when a row is selected/clicked
   */
  onRowSelect?: (corsConfig: CorsConfig) => void;
  
  /**
   * Callback when a row is edited
   */
  onRowEdit?: (corsConfig: CorsConfig) => void;
  
  /**
   * Callback when create is triggered
   */
  onCreate?: () => void;
  
  /**
   * Additional CSS classes for table styling
   */
  className?: string;
  
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Column definition for the CORS table
 */
interface CorsTableColumn {
  key: keyof CorsConfig | 'actions';
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: CorsConfig) => React.ReactNode;
}

/**
 * Virtual table row props
 */
interface VirtualRowProps {
  index: number;
  corsConfig: CorsConfig;
  columns: CorsTableColumn[];
  isSelected: boolean;
  isEven: boolean;
  style: React.CSSProperties;
  onClick: (corsConfig: CorsConfig) => void;
  onEdit: (corsConfig: CorsConfig) => void;
  onDelete: (corsConfig: CorsConfig) => void;
  onToggle: (corsConfig: CorsConfig) => void;
}

/**
 * Confirmation dialog props
 */
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  corsConfig: CorsConfig | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Default page sizes for pagination
 */
const PAGE_SIZES = [10, 25, 50, 100, 250] as const;

/**
 * Virtual scrolling configuration
 * Optimized for 1000+ CORS entries per requirements
 */
const VIRTUAL_CONFIG = {
  ESTIMATED_ROW_HEIGHT: 72, // Height per row in pixels
  OVERSCAN: 10, // Extra rows to render for smooth scrolling
  BUFFER_SIZE: 50, // Number of items to maintain in memory
} as const;

/**
 * Column definitions for the CORS table
 * Maps to original Angular component columns with React patterns
 */
const CORS_TABLE_COLUMNS: CorsTableColumn[] = [
  {
    key: 'enabled',
    header: 'Status',
    sortable: true,
    width: 'w-20',
    align: 'center',
    render: (enabled: boolean, row: CorsConfig) => (
      <div 
        className="flex items-center justify-center"
        data-testid={`cors-status-${row.id}`}
      >
        {enabled ? (
          <CheckCircle 
            className="h-5 w-5 text-green-600 dark:text-green-400" 
            aria-label="CORS configuration enabled"
          />
        ) : (
          <XCircle 
            className="h-5 w-5 text-red-600 dark:text-red-400" 
            aria-label="CORS configuration disabled"
          />
        )}
        <span className="sr-only">
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    ),
  },
  {
    key: 'path',
    header: 'Path',
    sortable: true,
    width: 'w-48',
    render: (path: string, row: CorsConfig) => (
      <div 
        className="font-mono text-sm truncate"
        title={path}
        data-testid={`cors-path-${row.id}`}
      >
        <Globe className="inline h-4 w-4 mr-2 text-blue-500" aria-hidden="true" />
        {path}
      </div>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    sortable: true,
    width: 'flex-1',
    render: (description: string, row: CorsConfig) => (
      <div 
        className="text-sm text-gray-900 dark:text-gray-100 truncate"
        title={description}
        data-testid={`cors-description-${row.id}`}
      >
        {description || <span className="text-gray-400 italic">No description</span>}
      </div>
    ),
  },
  {
    key: 'origin',
    header: 'Origin',
    sortable: true,
    width: 'w-32',
    render: (origin: string, row: CorsConfig) => (
      <div 
        className="font-mono text-xs truncate"
        title={origin}
        data-testid={`cors-origin-${row.id}`}
      >
        {origin === '*' ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
            Any
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
            {origin}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'maxAge',
    header: 'Max Age',
    sortable: true,
    width: 'w-24',
    align: 'right',
    render: (maxAge: number, row: CorsConfig) => (
      <div 
        className="text-sm font-mono text-right"
        data-testid={`cors-max-age-${row.id}`}
      >
        <Clock className="inline h-4 w-4 mr-1 text-gray-500" aria-hidden="true" />
        {maxAge.toLocaleString()}s
      </div>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    width: 'w-32',
    align: 'center',
  },
] as const;

// ============================================================================
// Virtual Row Component
// ============================================================================

/**
 * Individual virtualized table row component
 * Optimized for performance with large datasets
 */
const VirtualTableRow = React.memo<VirtualRowProps>(({
  index,
  corsConfig,
  columns,
  isSelected,
  isEven,
  style,
  onClick,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const rowId = useId();
  
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTableRowElement>) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onClick(corsConfig);
        break;
      case 'e':
      case 'E':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onEdit(corsConfig);
        }
        break;
      case 'Delete':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onDelete(corsConfig);
        }
        break;
    }
  }, [corsConfig, onClick, onEdit, onDelete]);

  return (
    <tr
      id={rowId}
      style={style}
      role="row"
      tabIndex={0}
      aria-rowindex={index + 2} // +2 because header is row 1, and rows are 1-indexed
      aria-selected={isSelected}
      className={cn(
        'absolute inset-x-0 flex items-center border-b border-gray-200 dark:border-gray-700 transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        'focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20',
        isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
      )}
      onClick={() => onClick(corsConfig)}
      onKeyDown={handleKeyDown}
      data-testid={`cors-table-row-${corsConfig.id}`}
      aria-label={`CORS configuration ${corsConfig.description || corsConfig.path}, ${corsConfig.enabled ? 'enabled' : 'disabled'}`}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          role="gridcell"
          className={cn(
            'px-4 py-3 text-sm',
            column.width,
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right'
          )}
          data-testid={`cors-table-cell-${corsConfig.id}-${column.key}`}
        >
          {column.key === 'actions' ? (
            <div className="flex items-center justify-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(corsConfig);
                }}
                aria-label={`${corsConfig.enabled ? 'Disable' : 'Enable'} CORS configuration ${corsConfig.description || corsConfig.path}`}
                data-testid={`cors-toggle-button-${corsConfig.id}`}
                className="h-8 w-8 p-0"
              >
                {corsConfig.enabled ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(corsConfig);
                }}
                aria-label={`Edit CORS configuration ${corsConfig.description || corsConfig.path}`}
                data-testid={`cors-edit-button-${corsConfig.id}`}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(corsConfig);
                }}
                aria-label={`Delete CORS configuration ${corsConfig.description || corsConfig.path}`}
                data-testid={`cors-delete-button-${corsConfig.id}`}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : column.render ? (
            column.render(corsConfig[column.key], corsConfig)
          ) : (
            <span className="truncate">
              {String(corsConfig[column.key] ?? '')}
            </span>
          )}
        </td>
      ))}
    </tr>
  );
});

VirtualTableRow.displayName = 'VirtualTableRow';

// ============================================================================
// Delete Confirmation Dialog
// ============================================================================

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  corsConfig,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header>
          <Dialog.Title className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Delete CORS Configuration</span>
          </Dialog.Title>
        </Dialog.Header>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete the CORS configuration for{' '}
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              {corsConfig?.path}
            </span>
            ?
          </p>
          
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            This action cannot be undone.
          </p>
        </div>
        
        <Dialog.Footer className="mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="cors-delete-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
            loadingText="Deleting..."
            data-testid="cors-delete-confirm"
          >
            Delete CORS Configuration
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

// ============================================================================
// Main Component Implementation
// ============================================================================

/**
 * Main CORS table component with virtual scrolling and accessibility
 */
export const CorsTable = forwardRef<HTMLDivElement, CorsTableProps>(({
  data: externalData,
  allowCreate = true,
  allowFilter = true,
  initialPageSize = 25,
  onRowSelect,
  onRowEdit,
  onCreate,
  className,
  'data-testid': testId = 'cors-table',
}, ref) => {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<CorsConfigSort>({
    field: 'path',
    direction: 'asc',
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    corsConfig: CorsConfig | null;
  }>({
    isOpen: false,
    corsConfig: null,
  });

  // ============================================================================
  // Data Fetching and Operations
  // ============================================================================
  
  // Build query configuration for API calls
  const query = useMemo<CorsConfigQuery>(() => ({
    limit: pageSize,
    offset: 0,
    sort: [sortConfig],
    filter: searchTerm ? {
      description: searchTerm,
      path: searchTerm,
    } : undefined,
    includeCount: true,
  }), [pageSize, sortConfig, searchTerm]);

  // Fetch CORS configurations with SWR caching
  const {
    data: corsResponse,
    isLoading: isCorsLoading,
    error: corsError,
    mutate: refreshCors,
  } = useCorsList({
    query,
    // Enable auto-refresh every 30 seconds for real-time updates
    autoRefresh: true,
    refreshInterval: 30000,
    // Cache hit responses under 50ms per requirements
    staleTime: 60000, // 1 minute
    // Keep previous data during refetches for smooth UX
    keepPreviousData: true,
  });

  // Mutation hooks for CORS operations
  const deleteMutation = useCorsDelete({
    onSuccess: () => {
      setDeleteDialog({ isOpen: false, corsConfig: null });
      // Refresh the table after successful deletion
      refreshCors();
    },
    onError: (error) => {
      console.error('Failed to delete CORS configuration:', error);
    },
  });

  const toggleMutation = useCorsToggle({
    onSuccess: () => {
      // Refresh handled automatically by optimistic updates
      refreshCors();
    },
    onError: (error) => {
      console.error('Failed to toggle CORS configuration:', error);
    },
  });

  // ============================================================================
  // Data Processing
  // ============================================================================
  
  // Use external data for testing or API response for production
  const corsConfigs = useMemo(() => {
    if (externalData) return externalData;
    return corsResponse?.resource || [];
  }, [externalData, corsResponse?.resource]);

  const totalCount = useMemo(() => {
    if (externalData) return externalData.length;
    return corsResponse?.count || 0;
  }, [externalData, corsResponse?.count]);

  // ============================================================================
  // Virtual Scrolling Setup
  // ============================================================================
  
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: corsConfigs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_CONFIG.ESTIMATED_ROW_HEIGHT,
    overscan: VIRTUAL_CONFIG.OVERSCAN,
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleRowClick = useCallback((corsConfig: CorsConfig) => {
    setSelectedRowId(corsConfig.id);
    onRowSelect?.(corsConfig);
  }, [onRowSelect]);

  const handleRowEdit = useCallback((corsConfig: CorsConfig) => {
    onRowEdit?.(corsConfig);
  }, [onRowEdit]);

  const handleRowDelete = useCallback((corsConfig: CorsConfig) => {
    setDeleteDialog({
      isOpen: true,
      corsConfig,
    });
  }, []);

  const handleToggleEnabled = useCallback((corsConfig: CorsConfig) => {
    toggleMutation.mutate({
      id: corsConfig.id,
      enabled: !corsConfig.enabled,
    });
  }, [toggleMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.corsConfig) {
      deleteMutation.mutate({ id: deleteDialog.corsConfig.id });
    }
  }, [deleteDialog.corsConfig, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ isOpen: false, corsConfig: null });
  }, []);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      refreshCors();
    });
  }, [refreshCors]);

  const handleSort = useCallback((field: keyof CorsConfig) => {
    startTransition(() => {
      setSortConfig(prev => ({
        field,
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    });
  }, []);

  const handleSearch = useCallback((value: string) => {
    startTransition(() => {
      setSearchTerm(value);
    });
  }, []);

  const handleCreate = useCallback(() => {
    onCreate?.();
  }, [onCreate]);

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================
  
  const handleTableKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
      event.preventDefault();
      handleRefresh();
    }
  }, [handleRefresh]);

  // ============================================================================
  // Accessibility Announcements
  // ============================================================================
  
  const tableId = useId();
  const captionId = useId();
  const searchId = useId();

  const loadingAnnouncement = isCorsLoading ? 'Loading CORS configurations...' : '';
  const resultAnnouncement = `${totalCount} CORS configuration${totalCount !== 1 ? 's' : ''} found`;

  // ============================================================================
  // Render Component
  // ============================================================================
  
  return (
    <div
      ref={ref}
      className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}
      data-testid={testId}
      onKeyDown={handleTableKeyDown}
    >
      {/* Table Header with Controls */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CORS Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage Cross-Origin Resource Sharing settings
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={isCorsLoading}
              aria-label="Refresh CORS configurations"
              data-testid="cors-refresh-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {allowCreate && (
              <Button
                onClick={handleCreate}
                size="sm"
                aria-label="Create new CORS configuration"
                data-testid="cors-create-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create CORS Rule
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {allowFilter && (
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id={searchId}
                  type="text"
                  placeholder="Search CORS configurations..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="cors-search-input"
                  aria-label="Filter CORS configurations by description or path"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size-select" className="text-sm text-gray-600 dark:text-gray-400">
                Per page:
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="cors-page-size-select"
                aria-label="Number of CORS configurations per page"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* Status Information */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {corsError ? (
              <span className="text-red-600 dark:text-red-400">
                Error loading CORS configurations: {corsError.message}
              </span>
            ) : (
              <span data-testid="cors-count-display">
                {resultAnnouncement}
              </span>
            )}
          </div>
          
          {selectedRowId && (
            <div className="text-blue-600 dark:text-blue-400">
              Configuration {selectedRowId} selected
            </div>
          )}
        </div>
      </div>

      {/* Virtual Table Container */}
      <div className="flex-1 overflow-hidden">
        {/* Table Header */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <table
            id={tableId}
            role="table"
            aria-labelledby={captionId}
            aria-rowcount={corsConfigs.length + 1}
            className="w-full"
          >
            <caption id={captionId} className="sr-only">
              CORS configuration table with {totalCount} entries. Use arrow keys to navigate, Enter to select, Ctrl+E to edit, Ctrl+Delete to delete.
            </caption>
            
            <thead>
              <tr role="row" aria-rowindex={1} className="flex">
                {CORS_TABLE_COLUMNS.map((column, index) => (
                  <th
                    key={column.key}
                    role="columnheader"
                    scope="col"
                    aria-colindex={index + 1}
                    aria-sort={
                      column.sortable && sortConfig.field === column.key
                        ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                        : column.sortable ? 'none' : undefined
                    }
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      column.width,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none',
                    )}
                    tabIndex={column.sortable ? 0 : undefined}
                    onClick={column.sortable ? () => handleSort(column.key as keyof CorsConfig) : undefined}
                    onKeyDown={column.sortable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(column.key as keyof CorsConfig);
                      }
                    } : undefined}
                    data-testid={`cors-header-${column.key}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="ml-1">
                          {sortConfig.field === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            )
                          ) : (
                            <div className="h-4 w-4 opacity-50">
                              <ChevronUp className="h-2 w-4" aria-hidden="true" />
                              <ChevronDown className="h-2 w-4 -mt-1" aria-hidden="true" />
                            </div>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtual Table Body */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto"
          style={{ height: '100%' }}
          data-testid="cors-table-body"
        >
          {corsConfigs.length > 0 ? (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualItem => {
                const corsConfig = corsConfigs[virtualItem.index];
                const isSelected = selectedRowId === corsConfig.id;
                const isEven = virtualItem.index % 2 === 0;

                return (
                  <VirtualTableRow
                    key={corsConfig.id}
                    index={virtualItem.index}
                    corsConfig={corsConfig}
                    columns={CORS_TABLE_COLUMNS}
                    isSelected={isSelected}
                    isEven={isEven}
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                      height: `${virtualItem.size}px`,
                    }}
                    onClick={handleRowClick}
                    onEdit={handleRowEdit}
                    onDelete={handleRowDelete}
                    onToggle={handleToggleEnabled}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              {isCorsLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading CORS configurations...</span>
                </div>
              ) : corsError ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Failed to load CORS configurations</p>
                  <p className="text-sm mt-1">{corsError.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Globe className="h-8 w-8 mx-auto mb-2" />
                  <p>No CORS configurations found</p>
                  {allowCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreate}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First CORS Rule
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loadingAnnouncement || resultAnnouncement}
        {selectedRowId && ` Selected configuration ${selectedRowId}.`}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        corsConfig={deleteDialog.corsConfig}
        isDeleting={deleteMutation.isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
});

CorsTable.displayName = 'CorsTable';

// ============================================================================
// Export Component and Types
// ============================================================================

export default CorsTable;

export type {
  CorsTableProps,
  CorsTableColumn,
  VirtualRowProps,
  DeleteConfirmDialogProps,
};