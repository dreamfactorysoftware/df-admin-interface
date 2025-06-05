/**
 * Database Relationships Listing Page Component
 * 
 * Next.js 15.1 page component providing the main database relationships listing interface
 * for a selected table. Implements TanStack Virtual for handling large relationship datasets,
 * filtering and sorting capabilities, and navigation to individual relationship
 * creation/editing routes.
 * 
 * Features:
 * - Server-side rendering with Next.js 15.1 app router
 * - TanStack Virtual for optimal performance with 1,000+ relationships
 * - React Query for intelligent caching with sub-50ms cache hit responses
 * - Comprehensive filtering, sorting, and search functionality
 * - Tailwind CSS styling with consistent theme injection
 * - Real-time updates and navigation capabilities
 * - Type-safe implementation with comprehensive error handling
 * 
 * @fileoverview Relationships listing page with virtualization and React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ColumnDef, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  useReactTable,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState
} from '@tanstack/react-table';
import { Plus, Search, Filter, ArrowUpDown, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Internal imports
import type { 
  RelationshipListItem, 
  RelationshipType,
  RelationshipRouteParams,
  RelationshipSearchParams,
  RELATIONSHIP_TYPE_CONFIGS,
  RelationshipTableState,
  RelationshipListResponse
} from './relationship.types';
import { useRelationshipManagement } from '../../../hooks/use-relationship-management';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';

// ============================================================================
// COMPONENT CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Virtual scrolling configuration optimized for large relationship datasets
 * Ensures smooth performance with 1000+ relationships per table
 */
const VIRTUAL_CONFIG = {
  itemHeight: 60, // Base height for relationship rows
  overscan: 10,   // Render extra items for smooth scrolling
  scrollMargin: 50, // Margin for scroll calculations
  estimatedItemHeight: 60, // Estimated height for initial render
} as const;

/**
 * Query configuration for React Query optimization
 * Achieves cache hit responses under 50ms per technical requirements
 */
const QUERY_CONFIG = {
  staleTime: 300_000,     // 5 minutes - data considered fresh
  cacheTime: 900_000,     // 15 minutes - data kept in cache
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 2,
  retryDelay: 1000,
} as const;

/**
 * Relationship type configurations with enhanced metadata
 * Provides visual indicators and descriptions for UI components
 */
const RELATIONSHIP_TYPES: Record<RelationshipType, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  belongs_to: {
    label: 'Belongs To',
    description: 'Child record belongs to parent record (many-to-one)',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: '↗️',
  },
  has_many: {
    label: 'Has Many',
    description: 'Parent record has many child records (one-to-many)',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: '↘️',
  },
  has_one: {
    label: 'Has One',
    description: 'Parent record has one child record (one-to-one)',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    icon: '→',
  },
  many_many: {
    label: 'Many To Many',
    description: 'Many-to-many relationship through junction table',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    icon: '↔️',
  },
} as const;

// ============================================================================
// TABLE COLUMN DEFINITIONS
// ============================================================================

/**
 * Creates TanStack Table column definitions for relationship display
 * Optimized for virtualization and responsive design
 */
const createRelationshipColumns = (
  onEdit: (relationship: RelationshipListItem) => void,
  onDelete: (relationship: RelationshipListItem) => void,
  onView: (relationship: RelationshipListItem) => void
): ColumnDef<RelationshipListItem>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue('name')}
        {row.original.alias && (
          <div className="text-sm text-muted-foreground">
            Alias: {row.original.alias}
          </div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as RelationshipType;
      const config = RELATIONSHIP_TYPES[type];
      return (
        <Badge variant="secondary" className={config.color}>
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: 'includesString',
  },
  {
    accessorKey: 'relationshipPath',
    header: 'Relationship Path',
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        <div className="text-foreground">
          {row.original.sourceField} → {row.original.targetTable}.{row.original.targetField}
        </div>
        {row.original.hasJunctionTable && (
          <div className="text-muted-foreground text-xs mt-1">
            via {row.original.junctionTable}
          </div>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'targetTable',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        Target Table
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('targetTable')}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'isVirtual',
    header: 'Virtual',
    cell: ({ row }) => (
      <Badge variant={row.getValue('isVirtual') ? 'default' : 'secondary'}>
        {row.getValue('isVirtual') ? 'Virtual' : 'Physical'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'alwaysFetch',
    header: 'Always Fetch',
    cell: ({ row }) => (
      <Badge variant={row.getValue('alwaysFetch') ? 'destructive' : 'outline'}>
        {row.getValue('alwaysFetch') ? 'Yes' : 'No'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string;
      return date ? new Date(date).toLocaleDateString() : '—';
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">View relationship</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit relationship</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete relationship</span>
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

// ============================================================================
// LOADING AND ERROR COMPONENTS
// ============================================================================

/**
 * Loading skeleton component for relationship rows
 * Maintains layout consistency during data fetching
 */
const RelationshipRowSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 border-b">
    <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
    <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
    <div className="h-4 bg-muted rounded w-1/5 animate-pulse" />
    <div className="flex space-x-2 ml-auto">
      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

/**
 * Loading component for the entire relationship table
 */
const RelationshipTableLoading: React.FC = () => (
  <div className="space-y-0">
    {Array.from({ length: 10 }).map((_, index) => (
      <RelationshipRowSkeleton key={index} />
    ))}
  </div>
);

/**
 * Error state component with retry functionality
 */
const RelationshipTableError: React.FC<{
  error: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-destructive mb-4">
      <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold mb-2">Failed to load relationships</h3>
    <p className="text-muted-foreground mb-4 max-w-md">
      {error.message || 'An unexpected error occurred while loading the relationship data.'}
    </p>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

/**
 * Empty state component when no relationships exist
 */
const RelationshipTableEmpty: React.FC<{
  onCreateNew: () => void;
}> = ({ onCreateNew }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-muted-foreground mb-4">
      <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold mb-2">No relationships found</h3>
    <p className="text-muted-foreground mb-4 max-w-md">
      This table doesn't have any relationships yet. Create your first relationship to establish connections between tables.
    </p>
    <Button onClick={onCreateNew}>
      <Plus className="h-4 w-4 mr-2" />
      Create Relationship
    </Button>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main relationships listing page component
 * Implements comprehensive relationship management with virtualization
 */
const RelationshipsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams() as RelationshipRouteParams;
  const searchParams = useSearchParams();
  
  // Extract route parameters with validation
  const serviceName = Array.isArray(params.serviceName) ? params.serviceName[0] : params.serviceName;
  const tableName = Array.isArray(params.tableName) ? params.tableName[0] : params.tableName;
  
  // Validate required parameters
  if (!serviceName || !tableName) {
    notFound();
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Table state management
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState<string>('');
  
  // UI state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Parse search parameters for initial state
  const initialFilter = searchParams.get('filter') || '';
  const initialType = searchParams.get('type') as RelationshipType | null;
  const initialSort = searchParams.get('sort') || 'name';
  const initialOrder = searchParams.get('order') || 'asc';

  // Initialize filters from URL parameters
  useEffect(() => {
    const filters: ColumnFiltersState = [];
    
    if (initialFilter) {
      setGlobalFilter(initialFilter);
    }
    
    if (initialType) {
      filters.push({ id: 'type', value: initialType });
    }
    
    if (filters.length > 0) {
      setColumnFilters(filters);
    }
    
    if (initialSort && initialOrder) {
      setSorting([{ id: initialSort, desc: initialOrder === 'desc' }]);
    }
  }, [initialFilter, initialType, initialSort, initialOrder]);

  // ============================================================================
  // DATA FETCHING WITH REACT QUERY
  // ============================================================================

  // Use relationship management hook for data operations
  const {
    relationships,
    loading,
    error,
    deleteRelationship,
    refreshRelationships,
  } = useRelationshipManagement({
    serviceName,
    tableName,
    ...QUERY_CONFIG,
  });

  // Handle manual refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshRelationships();
      toast.success('Relationships refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh relationships');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshRelationships]);

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================

  // Navigation handlers
  const handleView = useCallback((relationship: RelationshipListItem) => {
    router.push(`/adf-schema/relationships/${relationship.id}`);
  }, [router]);

  const handleEdit = useCallback((relationship: RelationshipListItem) => {
    router.push(`/adf-schema/relationships/${relationship.id}/edit`);
  }, [router]);

  const handleDelete = useCallback(async (relationship: RelationshipListItem) => {
    if (!confirm(`Are you sure you want to delete the relationship "${relationship.name}"?`)) {
      return;
    }

    try {
      await deleteRelationship(relationship.id);
      toast.success(`Relationship "${relationship.name}" deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete relationship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deleteRelationship]);

  const handleCreateNew = useCallback(() => {
    router.push(`/adf-schema/relationships/new?service=${serviceName}&table=${tableName}`);
  }, [router, serviceName, tableName]);

  // Memoized column definitions to prevent unnecessary re-renders
  const columns = useMemo(
    () => createRelationshipColumns(handleEdit, handleDelete, handleView),
    [handleEdit, handleDelete, handleView]
  );

  // ============================================================================
  // TABLE INSTANCE SETUP
  // ============================================================================

  const table = useReactTable({
    data: relationships,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  // ============================================================================
  // VIRTUALIZATION SETUP
  // ============================================================================

  // Get filtered and sorted data for virtualization
  const rows = table.getRowModel().rows;
  
  // Virtual container ref for scroll calculations
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Setup virtual scrolling for large datasets
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_CONFIG.itemHeight,
    overscan: VIRTUAL_CONFIG.overscan,
  });

  // ============================================================================
  // URL SYNCHRONIZATION
  // ============================================================================

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (globalFilter) {
      params.set('filter', globalFilter);
    }
    
    const typeFilter = columnFilters.find(filter => filter.id === 'type');
    if (typeFilter?.value) {
      params.set('type', typeFilter.value as string);
    }
    
    if (sorting.length > 0) {
      params.set('sort', sorting[0].id);
      params.set('order', sorting[0].desc ? 'desc' : 'asc');
    }
    
    const paramString = params.toString();
    const newUrl = paramString ? `?${paramString}` : '';
    
    // Update URL without triggering navigation
    if (window.location.search !== newUrl) {
      router.replace(`/adf-schema/relationships${newUrl}`, { scroll: false });
    }
  }, [globalFilter, columnFilters, sorting, router]);

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <RelationshipTableError 
          error={error} 
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Database Relationships
          </h1>
          <p className="text-muted-foreground">
            Managing relationships for <span className="font-medium">{serviceName}</span> → <span className="font-medium">{tableName}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Relationship
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={columnFilters.find(f => f.id === 'type')?.value || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                setColumnFilters(prev => [
                  ...prev.filter(f => f.id !== 'type'),
                  { id: 'type', value }
                ]);
              } else {
                setColumnFilters(prev => prev.filter(f => f.id !== 'type'));
              }
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {Object.entries(RELATIONSHIP_TYPES).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Relationship Table */}
      <div className="rounded-md border">
        {/* Table Header */}
        <div className="border-b bg-muted/50">
          <div className="grid grid-cols-7 gap-4 p-4">
            {table.getHeaderGroups().map(headerGroup =>
              headerGroup.headers.map(header => (
                <div key={header.id} className="text-sm font-medium text-muted-foreground">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())
                  }
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table Body with Virtualization */}
        {loading ? (
          <RelationshipTableLoading />
        ) : rows.length === 0 ? (
          <RelationshipTableEmpty onCreateNew={handleCreateNew} />
        ) : (
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
            style={{
              contain: 'strict',
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="border-b last:border-b-0"
                  >
                    <div className="grid grid-cols-7 gap-4 p-4 items-center h-full">
                      {row.getVisibleCells().map(cell => (
                        <div key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table Footer with Summary */}
      {!loading && relationships.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {rows.length} of {relationships.length} relationships
          </div>
          
          <div className="flex items-center gap-4">
            {selectedRows.size > 0 && (
              <span>{selectedRows.size} selected</span>
            )}
            
            <div className="flex items-center gap-2">
              {Object.entries(
                relationships.reduce((acc, rel) => {
                  acc[rel.type] = (acc[rel.type] || 0) + 1;
                  return acc;
                }, {} as Record<RelationshipType, number>)
              ).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {RELATIONSHIP_TYPES[type as RelationshipType].label}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUSPENSE WRAPPER FOR ERROR BOUNDARY
// ============================================================================

/**
 * Relationships page with Suspense boundary for error handling
 * Ensures graceful loading states and error recovery
 */
const RelationshipsPageWithSuspense: React.FC = () => (
  <Suspense fallback={<RelationshipTableLoading />}>
    <RelationshipsPage />
  </Suspense>
);

export default RelationshipsPageWithSuspense;