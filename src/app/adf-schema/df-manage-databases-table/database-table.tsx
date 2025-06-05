'use client';

/**
 * React component that displays and manages a table of database service entries
 * with TanStack Virtual for large dataset handling.
 * 
 * Replaces Angular DfManageDatabasesTableComponent with React Query for data fetching,
 * Headless UI table components with Tailwind CSS styling, and Next.js routing for navigation.
 * Provides database service listing, view actions, and data filtering capabilities
 * optimized for handling 1000+ database entries per Section 5.2 Component Details.
 * 
 * @module DatabaseTable
 * @see Section 5.2 Component Details - Database Service Management Component
 * @see React/Next.js Integration Requirements - Cache hit responses under 50ms
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, Database, Filter, RefreshCw } from 'lucide-react';

// UI Components
import { ManageTable } from '@/components/ui/manage-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types and interfaces
import type { DatabaseService, DatabaseType } from '@/types/database';
import type { GenericListResponse } from '@/types/service';

// Hooks and utilities
import { useDebounce } from '@/hooks/use-debounce';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

/**
 * Database row data interface for table display
 * Maps from full DatabaseService to simplified table row format
 */
export interface DatabaseRowData {
  /** Service ID */
  id: number;
  /** Service name (unique identifier) */
  name: string;
  /** Service description */
  description: string;
  /** Service display label */
  label: string;
  /** Database type */
  type: DatabaseType;
  /** Service active status */
  isActive: boolean;
}

/**
 * Column helper for type-safe column definitions
 */
const columnHelper = createColumnHelper<DatabaseRowData>();

/**
 * Database type display metadata
 */
const DATABASE_TYPE_LABELS: Record<DatabaseType, string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  oracle: 'Oracle Database',
  mongodb: 'MongoDB',
  snowflake: 'Snowflake'
};

/**
 * Placeholder hook for database services data fetching
 * TODO: Implement actual hook with React Query and API client
 */
function useDatabaseServices() {
  return useQuery({
    queryKey: ['database-services'],
    queryFn: async (): Promise<GenericListResponse<DatabaseService>> => {
      // Placeholder implementation - replace with actual API call
      const response = await fetch('/api/v2/system/service?group=Database');
      if (!response.ok) {
        throw new Error('Failed to fetch database services');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache per React Query TTL configuration
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
}

/**
 * Placeholder hook for service types data fetching
 * TODO: Implement actual hook with React Query and API client
 */
function useServiceTypes() {
  return useQuery({
    queryKey: ['service-types', 'Database'],
    queryFn: async () => {
      // Placeholder implementation - replace with actual API call
      const response = await fetch('/api/v2/system/service_type?group=Database');
      if (!response.ok) {
        throw new Error('Failed to fetch service types');
      }
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes cache for service types
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Props interface for DatabaseTable component
 */
export interface DatabaseTableProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether to show system services */
  showSystemServices?: boolean;
}

/**
 * Database table component with virtual scrolling and filtering
 * 
 * Features:
 * - TanStack Virtual for performance with 1000+ entries
 * - React Query for intelligent caching (cache hit responses under 50ms)
 * - Real-time filtering with debounced input
 * - Next.js routing for navigation
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @param props Component props
 * @returns Database table component
 */
export function DatabaseTable({ 
  className,
  showSystemServices = false 
}: DatabaseTableProps) {
  const router = useRouter();
  const { preferences } = useAppStore();
  
  // Local state for table interactions
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Debounced global filter for performance
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  
  // Data fetching with React Query
  const { 
    data: servicesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useDatabaseServices();
  
  const { data: serviceTypesResponse } = useServiceTypes();
  
  /**
   * Transform service data to table row format
   * Filters active services and maps to simplified interface
   */
  const tableData = useMemo(() => {
    if (!servicesResponse?.resource) return [];
    
    return servicesResponse.resource
      .filter(service => service.isActive && (showSystemServices || !service.name.startsWith('_')))
      .map((service): DatabaseRowData => ({
        id: service.id || 0,
        name: service.name,
        description: service.description || '',
        label: service.label,
        type: service.type,
        isActive: service.isActive
      }));
  }, [servicesResponse, showSystemServices]);
  
  /**
   * Column definitions with sorting and filtering
   */
  const columns = useMemo<ColumnDef<DatabaseRowData>[]>(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <Link 
          href={`/adf-schema/df-manage-databases-table/${row.original.name}`}
          className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          {row.original.name}
        </Link>
      ),
      enableSorting: true,
      enableColumnFilter: true
    }),
    columnHelper.accessor('label', {
      header: 'Label',
      cell: ({ getValue }) => getValue() || '',
      enableSorting: true,
      enableColumnFilter: true
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground line-clamp-2">
          {getValue() || 'No description'}
        </span>
      ),
      enableSorting: false,
      enableColumnFilter: true
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: ({ getValue }) => {
        const type = getValue();
        return (
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {DATABASE_TYPE_LABELS[type] || type}
            </span>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'equals'
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDatabase(row.original.name)}
            className="h-8 w-8 p-0"
            aria-label={`View database ${row.original.name}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false
    })
  ], []);
  
  /**
   * Navigate to database detail view
   */
  const handleViewDatabase = useCallback((serviceName: string) => {
    router.push(`/adf-schema/df-manage-databases-table/${serviceName}`);
  }, [router]);
  
  /**
   * Handle table refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  
  /**
   * React Table instance configuration
   */
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    defaultColumn: {
      minSize: 50,
      maxSize: 500
    }
  });
  
  /**
   * Virtual scrolling configuration for large datasets
   * Optimized for 1000+ database entries per technical requirements
   */
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56, // Estimated row height in pixels
    overscan: 10, // Render extra rows for smooth scrolling
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined
  });
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Failed to load database services</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button
            onClick={handleRefresh}
            className="mt-4"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Database Services</h2>
          <p className="text-sm text-muted-foreground">
            Manage and configure database connections for API generation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search database services..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
              aria-label="Filter database services"
            />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `${table.getFilteredRowModel().rows.length} services`}
        </div>
      </div>
      
      {/* Table Content */}
      <div className="rounded-md border">
        <ManageTable
          table={table}
          isLoading={isLoading}
          virtualizer={rowVirtualizer}
          containerRef={tableContainerRef}
          emptyState={{
            icon: Database,
            title: 'No database services found',
            description: showSystemServices 
              ? 'No active database services are currently configured.'
              : 'No active database services are currently configured. System services are hidden.',
            action: (
              <Button
                variant="outline"
                onClick={() => router.push('/adf-services/create')}
              >
                <Database className="mr-2 h-4 w-4" />
                Create Database Service
              </Button>
            )
          }}
          className="min-h-[400px]"
        />
      </div>
      
      {/* Table Footer */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {table.getFilteredRowModel().rows.length} of {tableData.length} services
          </div>
          {tableData.length >= 1000 && (
            <div className="text-xs">
              Virtual scrolling active for optimal performance
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DatabaseTable;