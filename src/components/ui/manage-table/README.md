# ManageTable Component System

A comprehensive, high-performance data table component system for React 19/Next.js 15.1+ applications, built with TanStack Table, React Query, and TanStack Virtual. Designed to replace Angular Material tables with enhanced performance, accessibility, and developer experience.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Component Variants](#component-variants)
- [Performance Optimization](#performance-optimization)
- [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
- [Migration from Angular Material](#migration-from-angular-material)
- [TanStack Integration](#tanstack-integration)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The ManageTable component system provides a complete solution for displaying and interacting with tabular data, optimized for the DreamFactory admin interface requirements including:

- **High Performance**: Handles 1000+ rows with virtual scrolling
- **Accessibility First**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **TypeScript Safe**: Complete type definitions for all props and data structures
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Server State Management**: Integrated React Query for intelligent caching and synchronization
- **Modern Stack**: Built for React 19 with Next.js 15.1+ and Turbopack optimization

### Key Features

- ✅ **Virtual Scrolling**: Efficient rendering of large datasets (1000+ rows)
- ✅ **Sorting & Filtering**: Multi-column sorting with debounced search
- ✅ **Pagination**: Server-side and client-side pagination support
- ✅ **Row Actions**: Configurable action menus and bulk operations
- ✅ **Responsive**: Optimized for all screen sizes with adaptive layouts
- ✅ **Accessibility**: Full keyboard navigation and screen reader support
- ✅ **Type Safe**: Complete TypeScript integration with strict type checking
- ✅ **Theme Support**: Dark/light mode with system preference detection
- ✅ **Real-time Updates**: Automatic data synchronization with React Query

## Quick Start

### Installation

The ManageTable component is included in the DreamFactory admin interface. Import it directly:

```tsx
import { ManageTable } from '@/components/ui/manage-table';
import type { ManageTableProps, ColumnDef } from '@/components/ui/manage-table';
```

### Basic Usage

```tsx
import { ManageTable } from '@/components/ui/manage-table';

// Define your data structure
interface DatabaseService {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'oracle';
  status: 'active' | 'inactive';
  created_at: string;
}

// Define columns with type safety
const columns: ColumnDef<DatabaseService>[] = [
  {
    accessorKey: 'name',
    header: 'Service Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Database Type',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {row.getValue('type')}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      );
    },
  },
];

// Fetch data with React Query
function DatabaseServicesTable() {
  return (
    <ManageTable
      columns={columns}
      queryKey={['database-services']}
      queryFn={() => fetch('/api/v2/system/service').then(res => res.json())}
      pageSize={25}
      searchable
      sortable
      filterable
      density="comfortable"
      enableRowSelection
      onRowAction={(action, row) => {
        if (action === 'edit') {
          // Handle edit action
        }
      }}
    />
  );
}
```

## API Reference

### ManageTableProps Interface

```tsx
interface ManageTableProps<TData = any> {
  // Core table configuration
  columns: ColumnDef<TData>[];
  data?: TData[];
  
  // React Query integration
  queryKey?: QueryKey;
  queryFn?: QueryFunction<ApiResponse<TData[]>>;
  queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>;
  
  // Table behavior
  pageSize?: number;
  initialPageIndex?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGlobalFilter?: boolean;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableVirtualization?: boolean;
  
  // UI customization
  density?: 'compact' | 'comfortable' | 'spacious';
  variant?: 'default' | 'bordered' | 'striped' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // Search and filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  globalFilterFn?: FilterFn<TData>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  
  // Row actions
  rowActions?: RowAction<TData>[];
  bulkActions?: BulkAction<TData>[];
  onRowAction?: (action: string, row: Row<TData>) => void;
  onBulkAction?: (action: string, rows: Row<TData>[]) => void;
  
  // Event handlers
  onRowClick?: (row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  onSelectionChange?: (selectedRows: Row<TData>[]) => void;
  
  // Loading and error states
  loading?: boolean;
  error?: Error | null;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  
  // Accessibility
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  caption?: string;
  
  // Performance optimizations
  enableRowVirtualization?: boolean;
  estimateSize?: (index: number) => number;
  overscan?: number;
  
  // Advanced features
  enableExport?: boolean;
  exportFormats?: ('csv' | 'xlsx' | 'json')[];
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  enableColumnVisibility?: boolean;
  
  // Theme and styling
  theme?: 'light' | 'dark' | 'auto';
  stickyHeader?: boolean;
  fixedLayout?: boolean;
  zebra?: boolean;
}
```

### Column Definition Interface

```tsx
interface ColumnDef<TData = any> {
  // Core column properties
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => any;
  id?: string;
  header?: string | ((props: HeaderContext<TData>) => React.ReactNode);
  cell?: (props: CellContext<TData>) => React.ReactNode;
  footer?: string | ((props: HeaderContext<TData>) => React.ReactNode);
  
  // Column behavior
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableResizing?: boolean;
  enableHiding?: boolean;
  
  // Sizing
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  // Filtering
  filterFn?: FilterFn<TData>;
  getFilterValue?: () => any;
  
  // Sorting
  sortingFn?: SortingFn<TData>;
  sortDescFirst?: boolean;
  invertSorting?: boolean;
  
  // Aggregation
  aggregationFn?: AggregationFn<TData>;
  aggregatedCell?: (props: CellContext<TData>) => React.ReactNode;
  
  // Meta information
  meta?: {
    align?: 'left' | 'center' | 'right';
    className?: string;
    headerClassName?: string;
    cellClassName?: string;
    sortable?: boolean;
    filterable?: boolean;
    exportable?: boolean;
    description?: string;
  };
}
```

### Row and Bulk Actions

```tsx
interface RowAction<TData = any> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: (row: Row<TData>) => boolean;
  hidden?: (row: Row<TData>) => boolean;
  onClick: (row: Row<TData>) => void;
  confirmMessage?: string;
  shortcut?: string;
}

interface BulkAction<TData = any> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: (rows: Row<TData>[]) => boolean;
  onClick: (rows: Row<TData>[]) => void;
  confirmMessage?: string;
  maxSelection?: number;
  minSelection?: number;
}
```

## Component Variants

### Density Options

Control the visual density of your table for different use cases:

```tsx
// Compact density - minimal padding, more rows visible
<ManageTable 
  columns={columns} 
  data={data} 
  density="compact" 
/>

// Comfortable density - balanced spacing (default)
<ManageTable 
  columns={columns} 
  data={data} 
  density="comfortable" 
/>

// Spacious density - generous padding, easier touch targets
<ManageTable 
  columns={columns} 
  data={data} 
  density="spacious" 
/>
```

### Visual Variants

```tsx
// Default variant - clean, minimal styling
<ManageTable variant="default" />

// Bordered variant - visible borders around cells
<ManageTable variant="bordered" />

// Striped variant - alternating row colors
<ManageTable variant="striped" />

// Minimal variant - no borders, subtle hover effects
<ManageTable variant="minimal" />
```

### Size Options

```tsx
// Small size - compact for dense layouts
<ManageTable size="sm" />

// Medium size - standard size (default)
<ManageTable size="md" />

// Large size - prominent for feature tables
<ManageTable size="lg" />
```

## Performance Optimization

### Virtual Scrolling for Large Datasets

The ManageTable component automatically enables virtualization for datasets larger than 50 rows. For optimal performance with 1000+ rows:

```tsx
<ManageTable
  columns={columns}
  queryKey={['large-dataset']}
  queryFn={fetchLargeDataset}
  enableVirtualization={true}
  estimateSize={() => 52} // Estimated row height in pixels
  overscan={5} // Number of items to render outside visible area
  pageSize={100} // Larger page sizes reduce API calls
/>
```

### Performance Best Practices

#### 1. Optimize Column Definitions

```tsx
// ✅ Good - Memoized column definitions
const columns = useMemo(() => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue()}</span>
    ),
  },
], []);

// ❌ Avoid - Inline column definitions
<ManageTable columns={[{ accessorKey: 'name', header: 'Name' }]} />
```

#### 2. Implement Proper Data Fetching

```tsx
// ✅ Good - React Query with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['database-services', { page, search, filters }],
  queryFn: ({ queryKey }) => fetchServices(queryKey[1]),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

<ManageTable
  columns={columns}
  data={data?.items}
  loading={isLoading}
  error={error}
/>
```

#### 3. Debounced Search Implementation

```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

<ManageTable
  searchable
  searchPlaceholder="Search services..."
  globalFilterValue={debouncedSearch}
  onGlobalFilterChange={setSearch}
/>
```

#### 4. Optimize Row Actions

```tsx
// ✅ Good - Memoized row actions
const rowActions = useMemo(() => [
  {
    id: 'edit',
    label: 'Edit',
    icon: PencilIcon,
    onClick: handleEdit,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: TrashIcon,
    variant: 'destructive' as const,
    onClick: handleDelete,
    confirmMessage: 'Are you sure you want to delete this service?',
  },
], [handleEdit, handleDelete]);
```

### Memory Optimization

For applications handling very large datasets, implement these patterns:

```tsx
// Window-based virtualization for massive datasets
<ManageTable
  enableVirtualization
  estimateSize={useCallback((index: number) => {
    // Dynamic row sizing based on content
    return data[index]?.description ? 80 : 52;
  }, [data])}
  getItemKey={useCallback((index: number) => data[index]?.id || index, [data])}
/>
```

## Accessibility (WCAG 2.1 AA)

The ManageTable component is designed with accessibility as a first-class citizen, meeting WCAG 2.1 AA standards.

### Keyboard Navigation

#### Navigation Keys

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Navigate between focusable elements |
| `Arrow Keys` | Navigate between table cells |
| `Home` / `End` | Jump to first/last column in current row |
| `Page Up` / `Page Down` | Navigate by page in virtualized tables |
| `Space` | Toggle row selection |
| `Enter` | Activate focused element or row action |
| `Escape` | Close open menus or cancel actions |

#### Keyboard Navigation Example

```tsx
<ManageTable
  columns={columns}
  data={data}
  ariaLabel="Database services table"
  caption="A list of all database services with their configuration and status"
  enableKeyboardNavigation
  onKeyDown={(event, cell) => {
    // Custom keyboard handling
    if (event.key === 'Enter' && cell.row.original.status === 'active') {
      handleRowActivation(cell.row);
    }
  }}
/>
```

### Screen Reader Support

#### ARIA Labels and Descriptions

```tsx
<ManageTable
  ariaLabel="Database services management table"
  ariaLabelledBy="services-heading"
  ariaDescribedBy="services-description"
  caption="Database services with actions to edit, delete, or configure each service"
  columns={columns.map(col => ({
    ...col,
    meta: {
      ...col.meta,
      description: getColumnDescription(col.accessorKey),
    },
  }))}
/>
```

#### Status Announcements

```tsx
// The table automatically announces state changes
<ManageTable
  loading={isLoading}
  loadingMessage="Loading database services..."
  error={error}
  errorMessage="Failed to load services. Please try again."
  emptyStateMessage="No database services found. Create your first service to get started."
  onSelectionChange={(rows) => {
    // Announce selection changes
    announceToScreenReader(`${rows.length} rows selected`);
  }}
/>
```

### Color Contrast and Visual Design

All interactive elements meet WCAG 2.1 AA contrast requirements:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio  
- **UI components**: Minimum 3:1 contrast ratio
- **Focus indicators**: Visible 2px outlines with sufficient contrast

```tsx
// The component automatically applies accessible color schemes
<ManageTable
  theme="auto" // Respects user's system preference
  variant="default" // Uses accessible color combinations
  className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
/>
```

### Touch Target Sizes

All interactive elements meet the minimum 44×44px touch target size requirement:

```tsx
<ManageTable
  density="comfortable" // Ensures adequate touch targets
  size="md" // Standard size with 44px minimum height
  rowActions={rowActions.map(action => ({
    ...action,
    className: "min-h-[44px] min-w-[44px]" // Explicit touch target sizing
  }))}
/>
```

## Migration from Angular Material

### Key Differences

| Angular Material | ManageTable | Migration Notes |
|------------------|-------------|----------------|
| `mat-table` | `<ManageTable>` | Component-based approach |
| `MatTableDataSource` | React Query | Server state management |
| `mat-paginator` | Built-in pagination | Integrated pagination controls |
| `mat-sort` | Built-in sorting | Column-level sort configuration |
| `mat-form-field` | Built-in filtering | Integrated search and filters |
| `cdkVirtualScrollViewport` | TanStack Virtual | Automatic virtualization |

### Migration Example

#### Before (Angular Material)

```typescript
// Angular component
@Component({
  template: `
    <mat-form-field>
      <mat-label>Filter</mat-label>
      <input matInput (keyup)="applyFilter($event)" #input>
    </mat-form-field>
    
    <table mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let service">{{service.name}}</td>
      </ng-container>
      
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let service">
          <button mat-icon-button (click)="editService(service)">
            <mat-icon>edit</mat-icon>
          </button>
        </td>
      </ng-container>
      
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
    
    <mat-paginator [pageSizeOptions]="[5, 10, 20]"></mat-paginator>
  `
})
export class ServicesTableComponent {
  displayedColumns = ['name', 'type', 'status', 'actions'];
  dataSource = new MatTableDataSource(this.services);
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  editService(service: DatabaseService) {
    // Handle edit action
  }
}
```

#### After (React ManageTable)

```tsx
// React component
function ServicesTable() {
  const columns = useMemo<ColumnDef<DatabaseService>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() as string} />
      ),
    },
  ], []);

  const rowActions = useMemo<RowAction<DatabaseService>[]>(() => [
    {
      id: 'edit',
      label: 'Edit Service',
      icon: PencilIcon,
      onClick: (row) => editService(row.original),
    },
  ], []);

  return (
    <ManageTable
      columns={columns}
      queryKey={['database-services']}
      queryFn={() => fetchServices()}
      searchable
      searchPlaceholder="Filter services..."
      pageSize={10}
      rowActions={rowActions}
      onRowAction={(action, row) => {
        if (action === 'edit') {
          editService(row.original);
        }
      }}
    />
  );
}
```

### Migration Checklist

- [ ] **Data Source**: Replace `MatTableDataSource` with React Query
- [ ] **Columns**: Convert `matColumnDef` to `ColumnDef` objects
- [ ] **Sorting**: Remove `mat-sort` directives, use column-level `enableSorting`
- [ ] **Filtering**: Replace `mat-form-field` with `searchable` prop
- [ ] **Pagination**: Remove `mat-paginator`, use built-in pagination
- [ ] **Actions**: Convert `mat-icon-button` to `rowActions` configuration
- [ ] **Styling**: Replace Angular Material classes with Tailwind CSS
- [ ] **Event Handling**: Convert Angular events to React callback props
- [ ] **Lifecycle**: Replace Angular lifecycle hooks with React hooks
- [ ] **Testing**: Migrate from TestBed to React Testing Library

### Common Migration Patterns

#### 1. Custom Cell Renderers

```typescript
// Angular Material
<ng-container matColumnDef="status">
  <td mat-cell *matCellDef="let service">
    <mat-chip [color]="getStatusColor(service.status)">
      {{service.status}}
    </mat-chip>
  </td>
</ng-container>
```

```tsx
// React ManageTable
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ getValue }) => {
    const status = getValue() as string;
    return (
      <span className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-green-100 text-green-800": status === 'active',
          "bg-red-100 text-red-800": status === 'inactive',
        }
      )}>
        {status}
      </span>
    );
  },
}
```

#### 2. Custom Filters

```typescript
// Angular Material
applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
}
```

```tsx
// React ManageTable
<ManageTable
  globalFilterFn={(row, columnId, value) => {
    const searchValue = value.toLowerCase();
    return row.getValue(columnId)?.toString().toLowerCase().includes(searchValue);
  }}
  searchable
  searchPlaceholder="Search services..."
/>
```

## TanStack Integration

The ManageTable component leverages the TanStack ecosystem for optimal performance and developer experience.

### TanStack Table Integration

```tsx
// The component internally uses TanStack Table
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getVirtualRowModel: getVirtualRowModel(),
  // Additional table options are automatically configured
});
```

### TanStack Query Integration

```tsx
// Automatic React Query integration
<ManageTable
  queryKey={['services', { page, search, filters }]}
  queryFn={async ({ queryKey }) => {
    const [, params] = queryKey;
    const response = await fetch(`/api/services?${new URLSearchParams(params)}`);
    return response.json();
  }}
  queryOptions={{
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  }}
/>
```

### TanStack Virtual Integration

```tsx
// Automatic virtualization for large datasets
<ManageTable
  enableVirtualization
  virtualOptions={{
    overscan: 5,
    estimateSize: () => 52,
    scrollMargin: 0,
    initialOffset: 0,
  }}
  onVirtualChange={(virtualizer) => {
    // Access virtualization state
    const { scrollElement, totalSize, visibleRange } = virtualizer;
  }}
/>
```

### Advanced TanStack Patterns

#### Server-Side Operations

```tsx
// Server-side sorting, filtering, and pagination
<ManageTable
  queryKey={['services']}
  queryFn={({ queryKey, pageParam = 0 }) => {
    const [, filters] = queryKey;
    return fetchServices({
      page: pageParam,
      pageSize: 25,
      sort: filters.sorting,
      filter: filters.globalFilter,
      ...filters.columnFilters,
    });
  }}
  manualSorting
  manualFiltering
  manualPagination
  onSortingChange={(sorting) => {
    // Update query parameters
    setQueryParams(prev => ({ ...prev, sorting }));
  }}
  onGlobalFilterChange={(filter) => {
    setQueryParams(prev => ({ ...prev, globalFilter: filter }));
  }}
/>
```

#### Infinite Scroll

```tsx
// Implement infinite scrolling with TanStack Query
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['services-infinite'],
  queryFn: ({ pageParam = 0 }) => fetchServicesPage(pageParam),
  getNextPageParam: (lastPage, pages) => 
    lastPage.hasMore ? pages.length : undefined,
});

<ManageTable
  data={data?.pages.flatMap(page => page.items) ?? []}
  enableVirtualization
  onScrollToBottom={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  loading={isFetchingNextPage}
/>
```

## Usage Examples

### Basic Data Table

```tsx
import { ManageTable } from '@/components/ui/manage-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => (
      <div className="font-medium text-gray-900">{getValue()}</div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => (
      <div className="text-gray-600">{getValue()}</div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: ({ getValue }) => (
      <div className="text-gray-500 text-sm">
        {formatDate(getValue() as string)}
      </div>
    ),
  },
];

function UsersTable() {
  return (
    <ManageTable
      columns={columns}
      queryKey={['users']}
      queryFn={() => fetch('/api/users').then(res => res.json())}
      searchable
      searchPlaceholder="Search users..."
      pageSize={25}
      enableRowSelection
      rowActions={[
        {
          id: 'edit',
          label: 'Edit User',
          icon: PencilIcon,
          onClick: (row) => editUser(row.original),
        },
        {
          id: 'delete',
          label: 'Delete User',
          icon: TrashIcon,
          variant: 'destructive',
          onClick: (row) => deleteUser(row.original),
          confirmMessage: 'Are you sure you want to delete this user?',
        },
      ]}
    />
  );
}
```

### Advanced Database Services Table

```tsx
interface DatabaseService {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'sqlserver';
  host: string;
  port: number;
  database: string;
  status: 'active' | 'inactive' | 'error';
  lastTested: string;
  tableCount: number;
  created_at: string;
}

const databaseColumns: ColumnDef<DatabaseService>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Service Name',
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <DatabaseIcon 
          type={row.original.type} 
          className="h-5 w-5"
        />
        <div>
          <div className="font-medium text-gray-900">
            {row.getValue('name')}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.host}:{row.original.port}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Database Type',
    cell: ({ getValue }) => (
      <DatabaseTypeBadge type={getValue() as DatabaseService['type']} />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue, row }) => (
      <StatusIndicator 
        status={getValue() as DatabaseService['status']}
        lastTested={row.original.lastTested}
      />
    ),
  },
  {
    accessorKey: 'tableCount',
    header: 'Tables',
    cell: ({ getValue }) => (
      <div className="text-right font-mono">
        {getValue()?.toLocaleString()}
      </div>
    ),
    meta: {
      align: 'right',
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ getValue }) => (
      <div className="text-sm text-gray-500">
        {formatRelativeTime(getValue() as string)}
      </div>
    ),
  },
];

function DatabaseServicesTable() {
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const rowActions: RowAction<DatabaseService>[] = [
    {
      id: 'test',
      label: 'Test Connection',
      icon: PlayIcon,
      onClick: async (row) => {
        await testConnection(row.original.id);
      },
    },
    {
      id: 'schema',
      label: 'Browse Schema',
      icon: DatabaseIcon,
      onClick: (row) => {
        router.push(`/services/${row.original.id}/schema`);
      },
    },
    {
      id: 'generate',
      label: 'Generate APIs',
      icon: CodeIcon,
      onClick: (row) => {
        router.push(`/services/${row.original.id}/generate`);
      },
    },
    {
      id: 'edit',
      label: 'Edit Service',
      icon: PencilIcon,
      onClick: (row) => {
        router.push(`/services/${row.original.id}/edit`);
      },
    },
    {
      id: 'delete',
      label: 'Delete Service',
      icon: TrashIcon,
      variant: 'destructive',
      onClick: async (row) => {
        await deleteService(row.original.id);
      },
      confirmMessage: 'This will permanently delete the service and all its configurations. This action cannot be undone.',
    },
  ];

  const bulkActions: BulkAction<DatabaseService>[] = [
    {
      id: 'test-all',
      label: 'Test All Connections',
      icon: PlayIcon,
      onClick: async (rows) => {
        await Promise.all(
          rows.map(row => testConnection(row.original.id))
        );
      },
    },
    {
      id: 'delete-all',
      label: 'Delete Selected',
      icon: TrashIcon,
      variant: 'destructive',
      onClick: async (rows) => {
        await Promise.all(
          rows.map(row => deleteService(row.original.id))
        );
      },
      confirmMessage: 'This will permanently delete all selected services. This action cannot be undone.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Database Services
        </h2>
        <div className="flex items-center space-x-2">
          <ColumnVisibilityDropdown
            columns={databaseColumns}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
          <Button onClick={() => router.push('/services/create')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Service
          </Button>
        </div>
      </div>

      <ManageTable
        columns={databaseColumns}
        queryKey={['database-services', { sorting, columnFilters }]}
        queryFn={({ queryKey }) => {
          const [, params] = queryKey;
          return fetchDatabaseServices(params);
        }}
        searchable
        searchPlaceholder="Search services..."
        pageSize={25}
        density="comfortable"
        variant="bordered"
        enableRowSelection
        enableMultiRowSelection
        enableVirtualization
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onRowClick={(row) => {
          router.push(`/services/${row.original.id}`);
        }}
        emptyStateMessage="No database services found. Create your first service to get started."
        emptyStateAction={
          <Button onClick={() => router.push('/services/create')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Service
          </Button>
        }
      />
    </div>
  );
}
```

### Real-time Updates with WebSocket

```tsx
function LiveServicesTable() {
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/services`);
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      if (type === 'SERVICE_UPDATED') {
        // Optimistically update the cache
        queryClient.setQueryData(['database-services'], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            items: old.items.map((service: DatabaseService) =>
              service.id === data.id ? { ...service, ...data } : service
            ),
          };
        });
      }
    };
    
    return () => ws.close();
  }, [queryClient]);

  return (
    <ManageTable
      columns={columns}
      queryKey={['database-services']}
      queryFn={fetchDatabaseServices}
      queryOptions={{
        refetchInterval: 30000, // Fallback polling every 30 seconds
        refetchIntervalInBackground: false,
      }}
      // ... other props
    />
  );
}
```

### Custom Column Filters

```tsx
const columnsWithFilters: ColumnDef<DatabaseService>[] = [
  {
    accessorKey: 'type',
    header: 'Database Type',
    cell: ({ getValue }) => <DatabaseTypeBadge type={getValue()} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      filterComponent: ({ column }) => (
        <MultiSelect
          options={[
            { label: 'MySQL', value: 'mysql' },
            { label: 'PostgreSQL', value: 'postgresql' },
            { label: 'MongoDB', value: 'mongodb' },
            { label: 'Oracle', value: 'oracle' },
          ]}
          value={column.getFilterValue() as string[] || []}
          onValueChange={(value) => column.setFilterValue(value)}
          placeholder="Filter by type..."
        />
      ),
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    filterFn: 'includesString',
    meta: {
      filterComponent: ({ column }) => (
        <Select
          value={column.getFilterValue() as string || ''}
          onValueChange={(value) => column.setFilterValue(value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  },
];
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Performance Issues with Large Datasets

**Problem**: Table becomes slow with 1000+ rows
**Solution**: Enable virtualization and optimize column definitions

```tsx
// ✅ Good
<ManageTable
  enableVirtualization
  estimateSize={() => 52}
  overscan={5}
  columns={memoizedColumns} // Always memoize columns
/>

// ❌ Avoid
<ManageTable
  columns={[{ accessorKey: 'name' }]} // Creates new array on each render
/>
```

#### 2. TypeScript Type Errors

**Problem**: TypeScript complains about column definitions
**Solution**: Properly type your data and column definitions

```tsx
// ✅ Good
interface YourDataType {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: 'name', // TypeScript knows this exists
    header: 'Name',
  },
];

// ❌ Avoid
const columns = [ // No type information
  {
    accessorKey: 'nonexistentField', // No type checking
  },
];
```

#### 3. Accessibility Warnings

**Problem**: Screen reader announces too much information
**Solution**: Use proper ARIA labels and descriptions

```tsx
// ✅ Good
<ManageTable
  ariaLabel="Database services table"
  caption="List of database services with their current status"
  columns={columns.map(col => ({
    ...col,
    meta: {
      ...col.meta,
      description: `Column for ${col.header}`,
    },
  }))}
/>
```

#### 4. React Query Cache Issues

**Problem**: Data not updating after mutations
**Solution**: Invalidate queries after data changes

```tsx
const queryClient = useQueryClient();

const deleteMutation = useMutation({
  mutationFn: deleteService,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['database-services'] });
  },
});
```

#### 5. Memory Leaks in Development

**Problem**: Component keeps re-rendering unnecessarily
**Solution**: Properly memoize callbacks and dependencies

```tsx
// ✅ Good
const handleRowAction = useCallback((action: string, row: Row<DataType>) => {
  // Handle action
}, []);

const columns = useMemo(() => [
  // Column definitions
], []);

// ❌ Avoid
const handleRowAction = (action: string, row: Row<DataType>) => {
  // Creates new function on each render
};
```

### Debug Mode

Enable debug mode to troubleshoot issues:

```tsx
<ManageTable
  debug // Enables console logging
  debugAll // Enables all TanStack Table debug flags
  columns={columns}
  data={data}
/>
```

### Performance Monitoring

Monitor table performance in development:

```tsx
import { Profiler } from 'react';

<Profiler
  id="ManageTable"
  onRender={(id, phase, actualDuration) => {
    if (actualDuration > 16) { // More than one frame
      console.warn(`Table render took ${actualDuration}ms`);
    }
  }}
>
  <ManageTable {...props} />
</Profiler>
```

## Best Practices

### 1. Data Management

- **Use React Query**: Always prefer React Query for server state management
- **Implement proper caching**: Set appropriate `staleTime` and `cacheTime`
- **Handle loading states**: Provide clear feedback during data fetching
- **Error boundaries**: Wrap tables in error boundaries for graceful error handling

### 2. Performance

- **Memoize columns**: Always wrap column definitions in `useMemo`
- **Virtualize large datasets**: Enable virtualization for 50+ rows
- **Debounce search**: Implement proper debouncing for search inputs
- **Optimize re-renders**: Use `useCallback` for event handlers

### 3. Accessibility

- **Provide context**: Use `ariaLabel`, `caption`, and column descriptions
- **Test with screen readers**: Regularly test with actual assistive technology
- **Keyboard navigation**: Ensure all functionality is accessible via keyboard
- **Color contrast**: Verify all text meets WCAG 2.1 AA standards

### 4. User Experience

- **Clear empty states**: Provide helpful messages and actions when no data
- **Consistent loading**: Use skeleton loaders for better perceived performance
- **Responsive design**: Test on all device sizes and orientations
- **Progressive enhancement**: Ensure basic functionality works without JavaScript

### 5. Code Organization

- **Separate concerns**: Keep data fetching, state management, and UI separate
- **Reusable components**: Create reusable cell components for common patterns
- **Type safety**: Use strict TypeScript types throughout
- **Testing**: Write comprehensive tests for all table functionality

### 6. Styling

- **Use design tokens**: Leverage the established design system
- **Consistent spacing**: Follow the spacing scale for padding and margins
- **Theme support**: Ensure compatibility with light and dark modes
- **Responsive breakpoints**: Use established breakpoint system

---

## Contributing

When contributing to the ManageTable component system:

1. **Follow TypeScript strict mode**: All contributions must pass strict type checking
2. **Test accessibility**: Run axe-core tests and manual screen reader testing
3. **Performance testing**: Verify performance with large datasets (1000+ rows)
4. **Documentation**: Update this README for any API changes
5. **Examples**: Provide usage examples for new features

## Support

For questions and support:

- Check the [Troubleshooting](#troubleshooting) section
- Review [Usage Examples](#usage-examples)
- Consult the [TanStack Table documentation](https://tanstack.com/table/latest)
- Refer to [React Query documentation](https://tanstack.com/query/latest)

---

*This documentation is for the DreamFactory Admin Interface ManageTable component system, built with React 19, Next.js 15.1+, and the TanStack ecosystem.*