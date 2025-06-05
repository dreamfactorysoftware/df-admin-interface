# ManageTable Component System

A comprehensive, accessible, and performant data table component built with React 19, TanStack Table, and Tailwind CSS. This component system replaces the Angular Material table implementation with modern React patterns while maintaining feature parity and enhancing performance for large datasets (1000+ rows).

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Accessibility Features](#accessibility-features)
- [Performance Optimization](#performance-optimization)
- [TanStack Integration](#tanstack-integration)
- [Styling and Theming](#styling-and-theming)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

## Overview

The ManageTable component system provides a complete data table solution with:

- **Modern Architecture**: Built with React 19, TanStack Table v8, and TypeScript 5.8+
- **Performance**: Optimized for 1000+ row datasets with virtual scrolling
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Server State**: Intelligent caching with TanStack React Query
- **Customization**: Extensive theming and variant support

### Key Features

- ✅ Sorting (single and multi-column)
- ✅ Filtering (global and column-specific)
- ✅ Pagination (client and server-side)
- ✅ Row selection (single and bulk)
- ✅ Custom cell renderers
- ✅ Action menus and buttons
- ✅ Virtual scrolling for large datasets
- ✅ Dark/light theme support
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Responsive layout
- ✅ Loading and empty states

## Quick Start

```tsx
import { ManageTable } from '@/components/ui/manage-table';
import type { Column, TableData } from '@/components/ui/manage-table/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

// Define columns
const columns: Column<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    cell: ({ getValue }) => getValue(),
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    cell: ({ getValue }) => getValue(),
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    cell: ({ getValue }) => getValue(),
  },
  {
    id: 'active',
    header: 'Status',
    accessorKey: 'active',
    cell: ({ getValue }) => (
      <span className={getValue() ? 'text-green-600' : 'text-red-600'}>
        {getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// Basic usage
function UserTable() {
  const [data, setData] = useState<User[]>([]);
  
  return (
    <ManageTable
      data={data}
      columns={columns}
      onRowClick={(user) => console.log('Selected user:', user)}
      pagination={{ pageSize: 25 }}
      enableSorting
      enableFiltering
    />
  );
}
```

## API Reference

### ManageTable Props

```typescript
interface ManageTableProps<T> {
  // Data
  data: T[];
  columns: Column<T>[];
  
  // Features
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableVirtualization?: boolean;
  
  // Pagination
  pagination?: {
    pageSize?: number;
    pageSizeOptions?: number[];
    serverSide?: boolean;
    totalCount?: number;
  };
  
  // Actions
  actions?: TableActions<T>;
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onSortChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  
  // Styling
  variant?: 'default' | 'compact' | 'comfortable';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  
  // Loading states
  loading?: boolean;
  error?: string | null;
  
  // Advanced
  getRowId?: (row: T) => string;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
}
```

### Column Definition

```typescript
interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  
  // Cell rendering
  cell?: (info: CellContext<T, any>) => React.ReactNode;
  
  // Sorting
  enableSorting?: boolean;
  sortingFn?: string | SortingFn<T>;
  
  // Filtering
  enableColumnFilter?: boolean;
  filterFn?: string | FilterFn<T>;
  
  // Sizing
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  // Visibility
  enableHiding?: boolean;
  
  // Meta information
  meta?: {
    className?: string;
    headerClassName?: string;
    footerClassName?: string;
  };
}
```

### Action Definitions

```typescript
interface TableActions<T> {
  primary?: {
    label: string;
    onClick: (row: T) => void;
    disabled?: (row: T) => boolean;
    ariaLabel?: string;
    icon?: React.ComponentType<any>;
  };
  
  secondary?: Array<{
    label: string;
    onClick: (row: T) => void;
    disabled?: (row: T) => boolean;
    ariaLabel?: string;
    icon?: React.ComponentType<any>;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  }>;
  
  bulk?: Array<{
    label: string;
    onClick: (rows: T[]) => void;
    disabled?: (rows: T[]) => boolean;
    ariaLabel?: string;
    icon?: React.ComponentType<any>;
  }>;
}
```

## Usage Examples

### Basic Table with Sorting and Filtering

```tsx
function DatabaseServicesTable() {
  const {
    data: services,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['database-services'],
    queryFn: fetchDatabaseServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const columns: Column<DatabaseService>[] = [
    {
      id: 'name',
      header: 'Service Name',
      accessorKey: 'name',
      cell: ({ getValue, row }) => (
        <div className="font-medium">
          {getValue()}
          {row.original.is_active && (
            <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Database Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
          {getValue()}
        </span>
      ),
    },
    {
      id: 'connection_string',
      header: 'Connection',
      accessorKey: 'config.connection_string',
      cell: ({ getValue }) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {getValue()?.replace(/password=[^;]+/i, 'password=***')}
        </code>
      ),
    },
    {
      id: 'created_date',
      header: 'Created',
      accessorKey: 'created_date',
      cell: ({ getValue }) => (
        <time dateTime={getValue()}>
          {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
        </time>
      ),
    },
  ];

  const actions: TableActions<DatabaseService> = {
    primary: {
      label: 'Manage',
      onClick: (service) => router.push(`/database/${service.id}`),
      ariaLabel: 'Manage database service',
      icon: Settings,
    },
    secondary: [
      {
        label: 'Test Connection',
        onClick: async (service) => {
          await testDatabaseConnection(service.id);
          refetch();
        },
        ariaLabel: 'Test database connection',
        icon: TestTube,
      },
      {
        label: 'Export Schema',
        onClick: (service) => exportDatabaseSchema(service.id),
        ariaLabel: 'Export database schema',
        icon: Download,
      },
      {
        label: 'Delete',
        onClick: (service) => handleDelete(service),
        disabled: (service) => service.is_system_service,
        ariaLabel: 'Delete database service',
        icon: Trash2,
        variant: 'destructive',
      },
    ],
    bulk: [
      {
        label: 'Test Selected',
        onClick: (services) => testMultipleConnections(services),
        ariaLabel: 'Test selected database connections',
        icon: TestTube,
      },
      {
        label: 'Delete Selected',
        onClick: (services) => handleBulkDelete(services),
        ariaLabel: 'Delete selected database services',
        icon: Trash2,
      },
    ],
  };

  return (
    <ManageTable
      data={services || []}
      columns={columns}
      actions={actions}
      loading={isLoading}
      error={error?.message}
      enableSorting
      enableFiltering
      enableRowSelection
      enablePagination
      pagination={{
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100],
      }}
      onCreateNew={() => router.push('/database/create')}
      onRefresh={() => refetch()}
      searchPlaceholder="Search database services..."
      ariaLabel="Database services table"
      className="w-full"
    />
  );
}
```

### Virtual Scrolling for Large Datasets

```tsx
function LargeDatasetTable() {
  const [virtualData, setVirtualData] = useState<TableRecord[]>([]);

  // Simulate large dataset
  useEffect(() => {
    const generateData = () => {
      return Array.from({ length: 10000 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`,
        value: Math.random() * 1000,
        category: ['A', 'B', 'C'][i % 3],
        date: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      }));
    };
    
    setVirtualData(generateData());
  }, []);

  return (
    <ManageTable
      data={virtualData}
      columns={largeDatasetColumns}
      enableVirtualization
      enableSorting
      enableFiltering
      variant="compact"
      className="h-[600px]" // Fixed height required for virtualization
      ariaLabel="Large dataset table with virtual scrolling"
    />
  );
}
```

### Server-Side Pagination and Filtering

```tsx
function ServerSideTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'server-data',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
    ],
    queryFn: () =>
      fetchServerData({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        sort: sorting.map(s => `${s.desc ? '-' : ''}${s.id}`).join(','),
        filters: columnFilters.reduce((acc, filter) => {
          acc[filter.id] = filter.value;
          return acc;
        }, {} as Record<string, any>),
      }),
    keepPreviousData: true,
  });

  return (
    <ManageTable
      data={result?.data || []}
      columns={serverColumns}
      enableSorting
      enableFiltering
      enablePagination
      pagination={{
        pageSize: pagination.pageSize,
        pageSizeOptions: [10, 25, 50, 100],
        serverSide: true,
        totalCount: result?.total || 0,
      }}
      loading={isLoading}
      error={error?.message}
      onSortChange={setSorting}
      onFilterChange={setColumnFilters}
      onPaginationChange={setPagination}
      ariaLabel="Server-side paginated table"
    />
  );
}
```

### Custom Cell Renderers

```tsx
const customColumns: Column<User>[] = [
  {
    id: 'avatar',
    header: '',
    accessorKey: 'avatar_url',
    enableSorting: false,
    size: 60,
    cell: ({ getValue, row }) => (
      <Avatar className="h-8 w-8">
        <AvatarImage src={getValue()} alt={`${row.original.name} avatar`} />
        <AvatarFallback>
          {row.original.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'is_active',
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? 'success' : 'secondary'}>
        {getValue() ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'last_login',
    header: 'Last Login',
    accessorKey: 'last_login_date',
    cell: ({ getValue }) => {
      const date = getValue();
      return date ? (
        <div className="flex flex-col">
          <span className="text-sm">
            {format(new Date(date), 'MMM dd, yyyy')}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(date), 'HH:mm')}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">Never</span>
      );
    },
  },
];
```

## Accessibility Features

The ManageTable component implements comprehensive WCAG 2.1 AA accessibility features:

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate table cells (when focus is on table)
- **Enter/Space**: Activate buttons and row actions
- **Escape**: Close menus and dialogs
- **Page Up/Down**: Navigate pagination (when focused)

```tsx
// Keyboard navigation is automatically enabled
<ManageTable
  data={data}
  columns={columns}
  // Keyboard navigation works out of the box
  onRowClick={(row) => handleRowClick(row)}
  ariaLabel="Accessible data table with keyboard navigation"
/>
```

### Screen Reader Support

- Proper ARIA labels and descriptions
- Live region announcements for dynamic content
- Table semantics with proper headers
- Sort state announcements

```tsx
<ManageTable
  data={data}
  columns={columns}
  ariaLabel="User management table"
  ariaDescription="A table listing all system users with their roles and status"
  // Screen reader announcements for actions
  actions={{
    primary: {
      label: 'Edit',
      onClick: handleEdit,
      ariaLabel: 'Edit user profile', // Clear action description
    },
  }}
/>
```

### Focus Management

- Focus rings with 4.5:1 contrast ratio
- Focus trap in modals and menus
- Logical focus order
- Skip links for large tables

```tsx
// Focus management with custom indicators
<ManageTable
  data={data}
  columns={columns}
  className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
  // Focus automatically managed for all interactive elements
/>
```

### Color and Contrast

All colors meet WCAG 2.1 AA standards:

- Text contrast: 4.5:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum

```scss
// Built-in accessible color variants
.table-row {
  &:hover {
    background-color: rgb(248 250 252); /* 1.04:1 vs white for subtle hover */
  }
  
  &:focus-visible {
    outline: 2px solid #4f46e5; /* 7.14:1 contrast ratio */
    outline-offset: 2px;
  }
}
```

## Performance Optimization

### Virtual Scrolling

For datasets with 1000+ rows, enable virtualization:

```tsx
function OptimizedLargeTable() {
  return (
    <ManageTable
      data={largeDataset} // 10,000+ items
      columns={columns}
      enableVirtualization
      className="h-[400px]" // Fixed height required
      // Only visible rows are rendered
      virtualPadding={10} // Overscan for smooth scrolling
    />
  );
}
```

### React Query Integration

Intelligent caching and background updates:

```tsx
function CachedDataTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['table-data'],
    queryFn: fetchTableData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return (
    <ManageTable
      data={data || []}
      columns={columns}
      loading={isLoading}
      // Cached data shown instantly while fresh data loads
    />
  );
}
```

### Memoization

Optimize re-renders with React.memo and useMemo:

```tsx
const columns = useMemo<Column<TableData>[]>(
  () => [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      // Memoized cell renderer
      cell: memo(({ getValue }) => <span>{getValue()}</span>),
    },
  ],
  []
);

const MemoizedTable = memo(ManageTable);
```

### Debounced Filtering

Built-in debouncing for search performance:

```tsx
<ManageTable
  data={data}
  columns={columns}
  enableFiltering
  // Automatic 300ms debounce for search inputs
  searchPlaceholder="Search (debounced automatically)"
/>
```

## TanStack Integration

### TanStack Table

The component uses TanStack Table v8 for table logic:

```tsx
import { useReactTable } from '@tanstack/react-table';

// Internal implementation
function ManageTable<T>({ data, columns, ...props }: ManageTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Additional features configured automatically
  });

  // Table rendering with full TanStack features
}
```

### TanStack Virtual

For large datasets with smooth scrolling:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Automatically enabled when enableVirtualization={true}
function VirtualizedTableBody({ rows, container }) {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => container,
    estimateSize: () => 40, // Row height in pixels
    overscan: 10, // Render extra rows for smooth scrolling
  });

  // Renders only visible rows for optimal performance
}
```

### TanStack React Query

Server state management and caching:

```tsx
// Built-in integration patterns
function QueryIntegratedTable() {
  const queryClient = useQueryClient();
  
  const { data, refetch } = useQuery({
    queryKey: ['table-data'],
    queryFn: fetchData,
    staleTime: 300000, // 5 minutes
  });

  return (
    <ManageTable
      data={data || []}
      columns={columns}
      onRefresh={() => {
        // Invalidate and refetch
        queryClient.invalidateQueries(['table-data']);
        refetch();
      }}
    />
  );
}
```

## Styling and Theming

### Tailwind CSS Integration

The component uses Tailwind CSS 4.1+ with design tokens:

```tsx
// Built-in variant system
<ManageTable
  variant="compact"    // compact | default | comfortable
  size="sm"           // sm | md | lg
  className="shadow-lg rounded-lg border border-gray-200"
/>
```

### Theme Support

Dark and light mode with system preference detection:

```tsx
function ThemedTable() {
  const { theme } = useTheme();
  
  return (
    <ManageTable
      data={data}
      columns={columns}
      className={cn(
        'transition-colors duration-200',
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      )}
    />
  );
}
```

### Custom Styling

Override styles with CSS-in-JS or Tailwind classes:

```tsx
<ManageTable
  data={data}
  columns={columns}
  className="custom-table"
  // Custom variants through class-variance-authority
  style={{
    '--table-border-color': '#e5e7eb',
    '--table-hover-color': '#f9fafb',
  }}
/>
```

## Migration Guide

### From Angular Material Table

#### 1. Component Structure

**Angular (Before):**
```typescript
@Component({
  selector: 'app-data-table',
  template: `
    <mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="name">
        <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
        <mat-cell *matCellDef="let element">{{ element.name }}</mat-cell>
      </ng-container>
      <!-- More columns -->
      <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
    </mat-table>
  `
})
export class DataTableComponent {
  dataSource = new MatTableDataSource(this.data);
  displayedColumns = ['name', 'email', 'actions'];
}
```

**React (After):**
```tsx
function DataTable() {
  const columns: Column<User>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
    },
  ];

  return (
    <ManageTable
      data={data}
      columns={columns}
      enableSorting
    />
  );
}
```

#### 2. Data Fetching

**Angular (Before):**
```typescript
ngOnInit() {
  this.dataService.getData().subscribe(data => {
    this.dataSource.data = data;
  });
}
```

**React (After):**
```tsx
function DataTable() {
  const { data } = useQuery({
    queryKey: ['table-data'],
    queryFn: fetchData,
  });

  return <ManageTable data={data || []} columns={columns} />;
}
```

#### 3. Actions and Events

**Angular (Before):**
```typescript
onRowClick(row: any) {
  this.router.navigate(['/edit', row.id]);
}

deleteRow(row: any) {
  this.dataService.delete(row.id).subscribe(() => {
    this.refreshTable();
  });
}
```

**React (After):**
```tsx
const actions: TableActions<User> = {
  primary: {
    label: 'Edit',
    onClick: (row) => router.push(`/edit/${row.id}`),
  },
  secondary: [
    {
      label: 'Delete',
      onClick: async (row) => {
        await deleteUser(row.id);
        queryClient.invalidateQueries(['users']);
      },
      variant: 'destructive',
    },
  ],
};

return <ManageTable data={data} columns={columns} actions={actions} />;
```

#### 4. Pagination Migration

**Angular (Before):**
```html
<mat-paginator
  [pageSizeOptions]="[10, 25, 50]"
  [pageSize]="25"
  (page)="onPageChange($event)">
</mat-paginator>
```

**React (After):**
```tsx
<ManageTable
  data={data}
  columns={columns}
  enablePagination
  pagination={{
    pageSize: 25,
    pageSizeOptions: [10, 25, 50],
  }}
  onPaginationChange={(pagination) => {
    // Handle pagination changes
  }}
/>
```

#### 5. Filtering Migration

**Angular (Before):**
```typescript
applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
}
```

**React (After):**
```tsx
// Built-in filtering - no manual implementation needed
<ManageTable
  data={data}
  columns={columns}
  enableFiltering
  searchPlaceholder="Search users..."
/>
```

### Key Differences

| Feature | Angular Material | React ManageTable |
|---------|------------------|-------------------|
| **Data Source** | MatTableDataSource | Direct array prop |
| **Columns** | Template-based | Object configuration |
| **Sorting** | MatSort directive | Built-in with TanStack |
| **Filtering** | Manual filter property | Built-in debounced search |
| **Pagination** | Separate MatPaginator | Integrated prop |
| **Actions** | Template-based | Object configuration |
| **Virtualization** | Manual CdkVirtualScroll | Built-in TanStack Virtual |
| **Accessibility** | Manual ARIA setup | Automatic WCAG compliance |

## Troubleshooting

### Common Issues

#### 1. Virtual Scrolling Not Working

**Problem**: Large dataset performance issues
```tsx
// ❌ Incorrect - no fixed height
<ManageTable data={largeData} enableVirtualization />

// ✅ Correct - requires fixed height
<ManageTable 
  data={largeData} 
  enableVirtualization 
  className="h-[400px]"
/>
```

#### 2. Custom Cell Renderers Re-rendering

**Problem**: Performance issues with complex cells
```tsx
// ❌ Incorrect - recreated on every render
const columns = [
  {
    id: 'complex',
    cell: ({ row }) => <ComplexComponent data={row.original} />,
  },
];

// ✅ Correct - memoized cell renderer
const columns = useMemo(() => [
  {
    id: 'complex',
    cell: memo(({ row }) => <ComplexComponent data={row.original} />),
  },
], []);
```

#### 3. Server-Side Pagination Not Updating

**Problem**: Stale data during pagination
```tsx
// ❌ Incorrect - missing dependency
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});

// ✅ Correct - include pagination in query key
const { data } = useQuery({
  queryKey: ['data', pagination.pageIndex, pagination.pageSize],
  queryFn: () => fetchData(pagination),
  keepPreviousData: true,
});
```

#### 4. Accessibility Warnings

**Problem**: Missing ARIA labels
```tsx
// ❌ Incorrect - no accessibility context
<ManageTable data={data} columns={columns} />

// ✅ Correct - proper ARIA labeling
<ManageTable
  data={data}
  columns={columns}
  ariaLabel="User management table"
  ariaDescription="Table showing all registered users with their roles and status"
/>
```

#### 5. Theme Not Applied

**Problem**: Dark mode styles not working
```tsx
// ❌ Incorrect - missing theme provider
function App() {
  return <ManageTable data={data} columns={columns} />;
}

// ✅ Correct - wrapped in theme provider
function App() {
  return (
    <ThemeProvider>
      <ManageTable data={data} columns={columns} />
    </ThemeProvider>
  );
}
```

### Performance Debugging

Enable React Developer Tools Profiler to identify re-render issues:

```tsx
// Add debugging props in development
<ManageTable
  data={data}
  columns={columns}
  // Debug mode (development only)
  debugTable={process.env.NODE_ENV === 'development'}
  debugColumns={process.env.NODE_ENV === 'development'}
/>
```

### Testing Issues

Common testing patterns and solutions:

```tsx
// Testing with Mock Service Worker
import { render, screen } from '@testing-library/react';
import { server } from '@/test/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders table with data', async () => {
  render(<ManageTable data={mockData} columns={mockColumns} />);
  
  // Wait for table to render
  expect(await screen.findByRole('table')).toBeInTheDocument();
  
  // Check accessibility
  await axe(container);
});
```

### Build Issues

Common build problems and solutions:

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check

# Update dependencies
npm update @tanstack/react-table @tanstack/react-query
```

#### Bundle Size Issues
```bash
# Analyze bundle
npm run build:analyze

# Check for duplicate dependencies
npm ls @tanstack/react-table
```

For additional support, check the [component tests](./manage-table.test.tsx) and [Storybook stories](./manage-table.stories.tsx) for more usage examples.

## Related Components

- [Button](../button/README.md) - Action buttons used in table actions
- [Input](../input/README.md) - Search and filter inputs
- [Dialog](../dialog/README.md) - Confirmation dialogs for actions
- [Loading](../loading/README.md) - Loading states and indicators

## Contributing

When contributing to the ManageTable component:

1. Ensure all new features maintain WCAG 2.1 AA compliance
2. Add comprehensive tests for new functionality
3. Update TypeScript types for new props
4. Add Storybook stories for new variants
5. Update this documentation with examples
6. Test with large datasets (1000+ rows) for performance
7. Verify keyboard navigation works correctly
8. Test with screen readers when possible

---

Built with ❤️ using React 19, TanStack Table, and Tailwind CSS.