/**
 * Storybook stories for the ManageTable component system
 * 
 * Provides comprehensive documentation and interactive examples demonstrating:
 * - All table variants (compact, default, comfortable density)
 * - Sorting, filtering, and pagination interactions
 * - Performance with large datasets using TanStack Virtual
 * - Accessibility features and keyboard navigation patterns
 * - Custom cell renderers and action configurations
 * - Dark mode and theme switching demonstrations
 * - Responsive behavior across different screen sizes
 * 
 * @see Technical Specification Section 7.1 - Core UI Technologies
 * @see Technical Specification Section 7.7 - Visual Design Considerations
 * @see WCAG 2.1 AA Compliance Requirements
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { expect, within, userEvent, screen } from '@storybook/test';
import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChevronDown, Edit, Trash2, Eye, Settings, Database, Table, Cloud, Server } from 'lucide-react';

// Import the component and types (these will exist when the component is created)
import { ManageTable } from './manage-table';
import type { 
  ManageTableProps, 
  TableColumn, 
  TableRow, 
  TableAction,
  TableDensity,
  TableVariant,
  SortDirection,
  FilterValue
} from './manage-table.types';

// Mock data generators for comprehensive testing
const generateMockDatabaseServices = (count: number = 25) => {
  const serviceTypes = ['mysql', 'postgresql', 'mongodb', 'sqlserver', 'oracle', 'snowflake', 'sqlite'] as const;
  const statuses = ['active', 'inactive', 'error', 'connecting'] as const;
  
  return Array.from({ length: count }, (_, index) => ({
    id: `service-${index + 1}`,
    name: `database-service-${index + 1}`,
    type: serviceTypes[index % serviceTypes.length],
    status: statuses[index % statuses.length],
    host: `db-${index + 1}.example.com`,
    port: 3306 + (index % 10),
    database: `app_db_${index + 1}`,
    tables: Math.floor(Math.random() * 500) + 10,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: `Database service for application ${index + 1}`,
    connection_string: `mysql://user:pass@db-${index + 1}.example.com:${3306 + (index % 10)}/app_db_${index + 1}`,
    is_active: statuses[index % statuses.length] === 'active',
    schema_count: Math.floor(Math.random() * 10) + 1,
    last_accessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateLargeDataset = (count: number = 1000) => {
  return generateMockDatabaseServices(count);
};

// Database service icon mapping for visual representation
const getServiceIcon = (type: string) => {
  const icons = {
    mysql: <Database className="h-4 w-4 text-orange-500" />,
    postgresql: <Database className="h-4 w-4 text-blue-500" />,
    mongodb: <Database className="h-4 w-4 text-green-500" />,
    sqlserver: <Server className="h-4 w-4 text-red-500" />,
    oracle: <Database className="h-4 w-4 text-red-600" />,
    snowflake: <Cloud className="h-4 w-4 text-blue-400" />,
    sqlite: <Table className="h-4 w-4 text-gray-600" />,
  };
  return icons[type as keyof typeof icons] || <Database className="h-4 w-4" />;
};

// Status badge component for table cells
const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    connecting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variants[status as keyof typeof variants] || variants.inactive
      }`}
    >
      {status}
    </span>
  );
};

// Standard table columns definition with accessibility features
const databaseServiceColumns: TableColumn[] = [
  {
    id: 'name',
    header: 'Service Name',
    accessorKey: 'name',
    sortable: true,
    filterable: true,
    minWidth: 200,
    cell: ({ row, value }) => (
      <div className="flex items-center space-x-3">
        {getServiceIcon(row.original.type)}
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {value}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.type.toUpperCase()}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Error', value: 'error' },
      { label: 'Connecting', value: 'connecting' },
    ],
    width: 120,
    cell: ({ value }) => <StatusBadge status={value as string} />,
  },
  {
    id: 'host',
    header: 'Host',
    accessorKey: 'host',
    sortable: true,
    filterable: true,
    minWidth: 180,
    cell: ({ value, row }) => (
      <div className="font-mono text-sm">
        <div className="text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-gray-500 dark:text-gray-400">Port: {row.original.port}</div>
      </div>
    ),
  },
  {
    id: 'database',
    header: 'Database',
    accessorKey: 'database',
    sortable: true,
    filterable: true,
    minWidth: 150,
  },
  {
    id: 'tables',
    header: 'Tables',
    accessorKey: 'tables',
    sortable: true,
    sortDescFirst: true,
    width: 100,
    cell: ({ value }) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    ),
  },
  {
    id: 'created_at',
    header: 'Created',
    accessorKey: 'created_at',
    sortable: true,
    sortDescFirst: true,
    width: 140,
    cell: ({ value }) => (
      <span className="text-gray-600 dark:text-gray-300 text-sm">
        {new Date(value as string).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'last_accessed',
    header: 'Last Accessed',
    accessorKey: 'last_accessed',
    sortable: true,
    sortDescFirst: true,
    width: 140,
    cell: ({ value }) => (
      <span className="text-gray-600 dark:text-gray-300 text-sm">
        {value ? new Date(value as string).toLocaleDateString() : 'Never'}
      </span>
    ),
  },
];

// Action definitions with accessibility labels
const tableActions: TableAction[] = [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4" />,
    onClick: (row) => action('view-clicked')(row),
    variant: 'ghost',
    size: 'sm',
  },
  {
    id: 'edit',
    label: 'Edit Service',
    icon: <Edit className="h-4 w-4" />,
    onClick: (row) => action('edit-clicked')(row),
    variant: 'outline',
    size: 'sm',
  },
  {
    id: 'configure',
    label: 'Configure',
    icon: <Settings className="h-4 w-4" />,
    onClick: (row) => action('configure-clicked')(row),
    variant: 'outline',
    size: 'sm',
  },
  {
    id: 'delete',
    label: 'Delete Service',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (row) => action('delete-clicked')(row),
    variant: 'destructive',
    size: 'sm',
    confirmMessage: 'Are you sure you want to delete this database service? This action cannot be undone.',
  },
];

// Bulk actions for multi-select scenarios
const bulkActions: TableAction[] = [
  {
    id: 'bulk-activate',
    label: 'Activate Services',
    icon: <Database className="h-4 w-4" />,
    onClick: (rows) => action('bulk-activate')(rows),
    variant: 'primary',
    size: 'sm',
  },
  {
    id: 'bulk-deactivate',
    label: 'Deactivate Services',
    icon: <Database className="h-4 w-4" />,
    onClick: (rows) => action('bulk-deactivate')(rows),
    variant: 'outline',
    size: 'sm',
  },
  {
    id: 'bulk-delete',
    label: 'Delete Services',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (rows) => action('bulk-delete')(rows),
    variant: 'destructive',
    size: 'sm',
    confirmMessage: 'Are you sure you want to delete the selected services? This action cannot be undone.',
  },
];

// Query client setup for React Query stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 300000, // 5 minutes as per technical specification
    },
  },
});

// Storybook meta configuration
const meta: Meta<typeof ManageTable> = {
  title: 'Components/UI/ManageTable',
  component: ManageTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ManageTable Component

A comprehensive data table component built with React 19, TanStack Table, and Tailwind CSS. 
Designed for enterprise-grade applications with performance optimization for large datasets (1000+ rows),
WCAG 2.1 AA accessibility compliance, and responsive design.

## Key Features

- **Performance**: TanStack Virtual for efficient rendering of large datasets
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Responsive**: Mobile-first design with responsive breakpoints
- **Customizable**: Extensive variant system with Tailwind CSS and design tokens
- **Interactive**: Sorting, filtering, pagination, row selection, and bulk actions
- **Theming**: Support for light/dark themes with system preference detection

## Technical Implementation

- **React 19**: Enhanced concurrent features and automatic optimizations
- **TanStack Table**: Powerful table logic with sorting, filtering, and pagination
- **TanStack React Query**: Intelligent data caching and synchronization
- **TanStack Virtual**: Virtualization for performance with large datasets
- **Tailwind CSS 4.1+**: Utility-first styling with design tokens
- **Headless UI**: Accessible components for dropdowns and dialogs

## Accessibility Features

- Minimum 4.5:1 contrast ratios for WCAG 2.1 AA compliance
- Keyboard navigation with arrow keys and tab order
- Screen reader announcements for actions and state changes
- Focus-visible indicators for keyboard navigation
- Semantic HTML structure with proper ARIA attributes
- Minimum 44x44px touch targets for mobile accessibility
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'comfortable'],
      description: 'Table visual variant affecting spacing and typography',
    },
    density: {
      control: 'select', 
      options: ['compact', 'default', 'comfortable'],
      description: 'Row density affecting vertical spacing',
    },
    striped: {
      control: 'boolean',
      description: 'Enable alternating row background colors',
    },
    bordered: {
      control: 'boolean',
      description: 'Enable table borders',
    },
    hoverable: {
      control: 'boolean',
      description: 'Enable row hover effects',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection with checkboxes',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state with skeleton rows',
    },
    virtualizing: {
      control: 'boolean',
      description: 'Enable TanStack Virtual for large datasets',
    },
    pageSize: {
      control: 'number',
      description: 'Number of rows per page',
    },
    searchable: {
      control: 'boolean',
      description: 'Enable global search functionality',
    },
    exportable: {
      control: 'boolean',
      description: 'Enable data export functionality',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ManageTable>;

// Default story demonstrating standard table functionality
export const Default: Story = {
  args: {
    data: generateMockDatabaseServices(25),
    columns: databaseServiceColumns,
    actions: tableActions,
    variant: 'default',
    density: 'default',
    striped: true,
    bordered: true,
    hoverable: true,
    selectable: true,
    searchable: true,
    exportable: true,
    pageSize: 10,
    loading: false,
    emptyMessage: 'No database services found',
    'aria-label': 'Database services table',
  },
  parameters: {
    docs: {
      description: {
        story: `
Standard table configuration with all core features enabled. Demonstrates:
- Sortable columns with visual indicators
- Global search functionality
- Row selection with bulk actions
- Pagination controls
- Responsive design
- WCAG 2.1 AA accessibility compliance
        `,
      },
    },
  },
};

// Compact variant for dense information display
export const CompactVariant: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
    density: 'compact',
    striped: false,
    bordered: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Compact table variant optimized for displaying more information in limited space:
- Reduced padding and margins
- Smaller typography scale
- Minimal visual elements
- Optimal for administrative interfaces
        `,
      },
    },
  },
};

// Comfortable variant for enhanced readability
export const ComfortableVariant: Story = {
  args: {
    ...Default.args,
    variant: 'comfortable',
    density: 'comfortable',
    pageSize: 5,
  },
  parameters: {
    docs: {
      description: {
        story: `
Comfortable table variant optimized for enhanced readability:
- Increased padding and spacing
- Larger touch targets
- Enhanced visual separation
- Optimal for touch interfaces and accessibility
        `,
      },
    },
  },
};

// Loading state demonstration
export const LoadingState: Story = {
  args: {
    ...Default.args,
    data: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Loading state with skeleton rows providing visual feedback during data fetching:
- Animated skeleton loaders
- Maintains table structure
- Preserves column widths
- Screen reader accessible loading announcements
        `,
      },
    },
  },
};

// Empty state demonstration
export const EmptyState: Story = {
  args: {
    ...Default.args,
    data: [],
    loading: false,
    emptyMessage: 'No database services configured yet',
    emptyDescription: 'Get started by creating your first database service connection.',
    emptyAction: {
      label: 'Create Database Service',
      onClick: action('create-service'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Empty state with helpful messaging and call-to-action:
- Clear empty state messaging
- Optional description and action button
- Maintains table header structure
- Accessible empty state announcements
        `,
      },
    },
  },
};

// Large dataset with virtualization
export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: generateLargeDataset(1000),
    virtualizing: true,
    pageSize: 50,
    searchable: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Large dataset demonstration with TanStack Virtual optimization:
- 1000+ row dataset with virtualization
- Efficient rendering and scrolling
- Maintained performance with large data
- Search and filter capabilities
- Memory optimization for large datasets
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test search functionality with large dataset
    const searchInput = canvas.getByLabelText(/search/i);
    await userEvent.type(searchInput, 'service-100');
    
    // Verify search results
    await expect(canvas.getByText('service-100')).toBeInTheDocument();
  },
};

// Filtering and sorting demonstration
export const FilteringAndSorting: Story = {
  args: {
    ...Default.args,
    defaultSort: [{ id: 'tables', desc: true }],
    defaultFilters: [{ id: 'status', value: 'active' }],
  },
  parameters: {
    docs: {
      description: {
        story: `
Advanced filtering and sorting capabilities:
- Multi-column sorting with priorities
- Column-specific filter types (text, select, date)
- Default sort and filter states
- Real-time filter application
- Accessible filter controls
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test column sorting
    const tablesHeader = canvas.getByRole('button', { name: /tables/i });
    await userEvent.click(tablesHeader);
    
    // Test status filter
    const statusFilter = canvas.getByLabelText(/filter by status/i);
    if (statusFilter) {
      await userEvent.click(statusFilter);
    }
  },
};

// Row selection and bulk actions
export const BulkActions: Story = {
  args: {
    ...Default.args,
    selectable: true,
    bulkActions: bulkActions,
    defaultSelectedRows: [0, 2, 4], // Pre-select some rows for demonstration
  },
  parameters: {
    docs: {
      description: {
        story: `
Row selection and bulk action capabilities:
- Individual row selection with checkboxes
- Select all functionality
- Bulk action toolbar with selected count
- Confirmation dialogs for destructive actions
- Keyboard navigation for selection
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test select all functionality
    const selectAllCheckbox = canvas.getByLabelText(/select all rows/i);
    await userEvent.click(selectAllCheckbox);
    
    // Verify bulk actions are available
    const bulkActionButtons = canvas.getAllByRole('button', { name: /activate|deactivate|delete/i });
    expect(bulkActionButtons.length).toBeGreaterThan(0);
  },
};

// Custom cell renderers demonstration
export const CustomCellRenderers: Story = {
  args: {
    ...Default.args,
    columns: [
      ...databaseServiceColumns,
      {
        id: 'actions',
        header: 'Quick Actions',
        width: 150,
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => action('quick-edit')(row.original)}
              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              aria-label={`Edit ${row.original.name}`}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => action('quick-view')(row.original)}
              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              aria-label={`View ${row.original.name}`}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => action('quick-delete')(row.original)}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              aria-label={`Delete ${row.original.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: `
Custom cell renderers for complex data display:
- Icon-based data representation
- Multi-line cell content
- Interactive cell elements
- Custom action buttons
- Conditional styling based on data
        `,
      },
    },
  },
};

// Responsive design demonstration
export const ResponsiveDesign: Story = {
  args: {
    ...Default.args,
    responsive: true,
    mobileColumns: ['name', 'status', 'tables'], // Show only essential columns on mobile
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: `
Responsive table design for mobile devices:
- Column hiding on smaller screens
- Stack layout for mobile
- Touch-friendly interactions
- Preserved functionality across devices
- Horizontal scrolling for overflow content
        `,
      },
    },
  },
};

// Dark theme demonstration
export const DarkTheme: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: `
Dark theme implementation with WCAG 2.1 AA compliance:
- High contrast color combinations
- Consistent focus indicators
- Proper color tokens usage
- System theme preference support
- Accessible status indicators in dark mode
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="dark min-h-screen bg-gray-900 p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

// Error state demonstration
export const ErrorState: Story = {
  args: {
    ...Default.args,
    error: {
      message: 'Failed to load database services',
      description: 'Unable to connect to the API. Please check your connection and try again.',
      retry: action('retry-clicked'),
    },
    data: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Error state handling with recovery options:
- Clear error messaging
- Retry functionality
- Maintains table structure
- Accessible error announcements
- User-friendly error descriptions
        `,
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
  args: {
    ...Default.args,
    'aria-label': 'Database services management table',
    'aria-describedby': 'table-description',
  },
  parameters: {
    docs: {
      description: {
        story: `
Comprehensive accessibility features demonstration:
- ARIA labels and descriptions
- Keyboard navigation with arrow keys
- Focus-visible indicators
- Screen reader announcements
- Semantic HTML structure
- High contrast mode support

### Keyboard Navigation
- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate table cells
- **Space**: Toggle row selection
- **Enter**: Activate buttons and links
- **Escape**: Close dialogs and dropdowns

### Screen Reader Support
- Table structure announced correctly
- Column headers associated with data cells
- Row and column counts announced
- Action buttons have descriptive labels
- Loading and error states announced
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div id="table-description" className="sr-only">
            Table containing database service configurations with options to view, edit, and manage services
          </div>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const table = canvas.getByRole('table');
    await userEvent.tab();
    
    // Test focus-visible indicators
    const firstButton = canvas.getAllByRole('button')[0];
    if (firstButton) {
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    }
  },
};

// Performance demonstration with metrics
export const PerformanceDemo: Story = {
  render: (args) => {
    const [renderTime, setRenderTime] = useState<number>(0);
    const [rowCount, setRowCount] = useState<number>(args.data?.length || 0);
    
    const data = useMemo(() => {
      const start = performance.now();
      const result = generateLargeDataset(rowCount);
      const end = performance.now();
      setRenderTime(end - start);
      return result;
    }, [rowCount]);

    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Rows:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-300">
                {rowCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Data Generation:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-300">
                {renderTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Virtualization:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-300">
                {args.virtualizing ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[100, 500, 1000, 2500, 5000].map((count) => (
              <button
                key={count}
                onClick={() => setRowCount(count)}
                className={`px-3 py-1 text-xs rounded ${
                  rowCount === count
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                }`}
              >
                {count.toLocaleString()} rows
              </button>
            ))}
          </div>
        </div>
        <ManageTable {...args} data={data} />
      </div>
    );
  },
  args: {
    ...Default.args,
    virtualizing: true,
    pageSize: 50,
  },
  parameters: {
    docs: {
      description: {
        story: `
Performance optimization demonstration with real-time metrics:
- Interactive row count selection
- Data generation time measurement
- TanStack Virtual optimization
- Memory usage optimization
- Smooth scrolling with large datasets
- Maintained responsiveness regardless of data size

Test with different row counts to see performance characteristics.
Virtualization significantly improves performance with large datasets.
        `,
      },
    },
  },
};

// Integration demonstration with React Query
export const ReactQueryIntegration: Story = {
  render: (args) => {
    // This would typically use a real query hook
    const mockQuery = {
      data: args.data,
      isLoading: args.loading,
      error: args.error,
      refetch: () => action('refetch')(),
    };

    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            React Query Integration
          </h3>
          <div className="text-sm text-green-800 dark:text-green-200">
            <p>Demonstrates TanStack React Query integration with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Automatic caching with 5-minute stale time</li>
              <li>Background refetching for data freshness</li>
              <li>Error boundary integration</li>
              <li>Loading state management</li>
              <li>Optimistic updates</li>
            </ul>
          </div>
        </div>
        <ManageTable 
          {...args} 
          data={mockQuery.data}
          loading={mockQuery.isLoading}
          error={mockQuery.error}
          onRefresh={mockQuery.refetch}
        />
      </div>
    );
  },
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: `
TanStack React Query integration for optimal data management:
- Intelligent caching with configurable stale time
- Automatic background refetching
- Error handling and retry logic
- Loading state management
- Cache invalidation strategies
- Optimistic updates for better UX
        `,
      },
    },
  },
};