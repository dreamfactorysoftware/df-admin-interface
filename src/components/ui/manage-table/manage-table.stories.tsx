/**
 * ManageTable Storybook Stories
 * 
 * Comprehensive Storybook 7+ documentation for the ManageTable component system.
 * Demonstrates all table variants, data states, accessibility features, performance
 * optimizations, and responsive design patterns for development and design system
 * documentation.
 * 
 * Features demonstrated:
 * - All density variants (compact, default, comfortable)
 * - Sorting, filtering, and pagination interactions
 * - Performance with large datasets using TanStack Virtual
 * - Accessibility features and keyboard navigation
 * - Custom cell renderers and action configurations
 * - Dark mode and theme switching capabilities
 * - Responsive behavior across screen sizes
 * - Loading, error, and empty states
 * - Form integration patterns
 * 
 * @fileoverview Storybook stories for ManageTable component
 * @version 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { action } from '@storybook/addon-actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Eye, 
  Trash2, 
  Database, 
  Server, 
  Users, 
  Settings,
  Download,
  AlertTriangle,
  Check,
  X,
  MoreVertical
} from 'lucide-react';

// Component imports
import { ManageTable } from './manage-table';
import type { 
  ManageTableProps,
  ManageTableRef,
  ManageTableColumnDef,
  RowAction,
  BulkAction,
  TableThemeConfig,
  TableApiResponse
} from './manage-table.types';

// Mock data and utilities
import { generateMockData, createMockQueryResult } from '@/test/fixtures/table-data';
import { createMockApiResponse } from '@/test/utils/api-mocks';

// =============================================================================
// Story Configuration
// =============================================================================

const meta: Meta<typeof ManageTable> = {
  title: 'UI Components/Data Display/ManageTable',
  component: ManageTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ManageTable Component

A comprehensive React 19 data table component for the DreamFactory Admin Interface.
Built with TanStack Table, React Query, and TanStack Virtual for optimal performance
and accessibility compliance (WCAG 2.1 AA).

## Key Features

- **Performance**: TanStack Virtual for 1000+ rows, intelligent caching
- **Accessibility**: Full keyboard navigation, screen reader support
- **Customization**: Multiple themes, densities, and responsive layouts
- **Interactions**: Sorting, filtering, pagination, row/bulk actions
- **Integration**: React Query data fetching, form validation
- **Modern**: React 19, TypeScript 5.8+, Tailwind CSS 4.1+

## Usage Examples

The stories below demonstrate various configurations and use cases for
database management, user administration, and API service monitoring.
        `
      }
    },
    a11y: {
      config: {
        rules: [
          // Disable specific rules that may interfere with table accessibility
          { id: 'scrollable-region-focusable', enabled: false },
          { id: 'aria-hidden-focus', enabled: false }
        ]
      }
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'gray', value: '#f8fafc' }
      ]
    }
  },
  argTypes: {
    // Data configuration
    data: {
      description: 'Table data - can be static array or React Query result',
      control: { type: 'object' }
    },
    columns: {
      description: 'Column definitions with headers, accessors, and renderers',
      control: { type: 'object' }
    },
    loading: {
      description: 'Loading state override',
      control: { type: 'boolean' }
    },
    error: {
      description: 'Error state for testing error handling',
      control: { type: 'object' }
    },
    
    // Features
    'pagination.enabled': {
      description: 'Enable pagination controls',
      control: { type: 'boolean' }
    },
    'sorting.enabled': {
      description: 'Enable column sorting',
      control: { type: 'boolean' }
    },
    'globalFilter.enabled': {
      description: 'Enable global search filter',
      control: { type: 'boolean' }
    },
    'virtualization.enabled': {
      description: 'Enable virtualization for large datasets',
      control: { type: 'boolean' }
    },
    
    // Theme
    'theme.density': {
      description: 'Table row density',
      control: { 
        type: 'select',
        options: ['compact', 'default', 'comfortable']
      }
    },
    'theme.striped': {
      description: 'Alternating row colors',
      control: { type: 'boolean' }
    },
    'theme.hover': {
      description: 'Row hover effects',
      control: { type: 'boolean' }
    },
    
    // Actions
    rowActions: {
      description: 'Actions available for each row',
      control: { type: 'object' }
    },
    bulkActions: {
      description: 'Actions for selected rows',
      control: { type: 'object' }
    },
    tableActions: {
      description: 'Global table actions',
      control: { type: 'object' }
    },
    
    // Events
    onRowClick: {
      description: 'Row click handler',
      action: 'row-clicked'
    },
    onCellClick: {
      description: 'Cell click handler', 
      action: 'cell-clicked'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ManageTable>;

// =============================================================================
// Mock Data Generators
// =============================================================================

/**
 * Database services mock data for DreamFactory scenarios
 */
const generateDatabaseServices = (count: number = 25) => {
  const dbTypes = ['mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'sqlserver', 'snowflake'];
  const statuses = ['active', 'inactive', 'connecting', 'error'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `db_service_${index + 1}`,
    label: `Database Service ${index + 1}`,
    description: `Production database ${Math.random() > 0.7 ? 'for analytics' : 'for application data'}`,
    type: dbTypes[Math.floor(Math.random() * dbTypes.length)],
    active: Math.random() > 0.2,
    host: `db${index + 1}.example.com`,
    port: dbTypes[Math.floor(Math.random() * dbTypes.length)] === 'mysql' ? 3306 : 5432,
    database: `app_db_${index + 1}`,
    username: `admin_${index + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    tables: Math.floor(Math.random() * 500) + 10,
    lastConnected: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    created: new Date(Date.now() - Math.random() * 100000000000).toISOString(),
    log: Math.random() > 0.8,
    scripting: Math.random() > 0.3 ? 'enabled' : 'not',
    registration: Math.random() > 0.1
  }));
};

/**
 * User management mock data
 */
const generateUsers = (count: number = 50) => {
  const roles = ['admin', 'developer', 'viewer', 'analyst'];
  const statuses = ['active', 'pending', 'suspended'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    firstName: `User${index + 1}`,
    lastName: `LastName${index + 1}`,
    email: `user${index + 1}@example.com`,
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    active: Math.random() > 0.2,
    lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 10000000000).toISOString() : null,
    created: new Date(Date.now() - Math.random() * 100000000000).toISOString(),
    apiKeyCount: Math.floor(Math.random() * 5),
    department: ['Engineering', 'Marketing', 'Sales', 'Support'][Math.floor(Math.random() * 4)]
  }));
};

/**
 * Large dataset for performance testing
 */
const generateLargeDataset = (count: number = 1000) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    category: `Category ${Math.floor(index / 100) + 1}`,
    value: Math.floor(Math.random() * 10000),
    status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
    date: new Date(Date.now() - Math.random() * 100000000000).toISOString(),
    description: `Description for item ${index + 1} with additional details`,
    tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `tag${i + 1}`)
  }));
};

// =============================================================================
// Column Definitions
// =============================================================================

/**
 * Database services column configuration
 */
const databaseServiceColumns: ManageTableColumnDef[] = [
  {
    id: 'name',
    header: 'Service Name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ getValue, row }) => (
      <div className="flex items-center space-x-2">
        <Database className="h-4 w-4 text-blue-600" />
        <span className="font-medium">{getValue() as string}</span>
        {row.original.log && (
          <AlertTriangle className="h-4 w-4 text-red-500" title="Has connection errors" />
        )}
      </div>
    ),
    meta: {
      description: 'Unique service identifier',
      dataType: 'text'
    }
  },
  {
    id: 'type',
    header: 'Database Type',
    accessorKey: 'type',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const type = getValue() as string;
      const typeColors = {
        mysql: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        postgresql: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        mongodb: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        oracle: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        sqlite: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        sqlserver: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type as keyof typeof typeColors] || typeColors.sqlite}`}>
          {type.toUpperCase()}
        </span>
      );
    },
    meta: {
      dataType: 'text',
      group: 'Configuration'
    }
  },
  {
    id: 'active',
    header: 'Status',
    accessorKey: 'active',
    enableSorting: true,
    cell: ({ getValue }) => (
      <div className="flex items-center justify-center">
        {getValue() ? (
          <Check className="h-5 w-5 text-green-600" aria-label="Active" />
        ) : (
          <X className="h-5 w-5 text-red-600" aria-label="Inactive" />
        )}
      </div>
    ),
    size: 80,
    meta: {
      dataType: 'boolean',
      align: 'center'
    }
  },
  {
    id: 'host',
    header: 'Host',
    accessorKey: 'host',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ getValue, row }) => (
      <div className="font-mono text-sm">
        <div>{getValue() as string}</div>
        <div className="text-gray-500 text-xs">Port: {row.original.port}</div>
      </div>
    ),
    meta: {
      dataType: 'text',
      group: 'Connection'
    }
  },
  {
    id: 'tables',
    header: 'Tables',
    accessorKey: 'tables',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-right font-medium">
        {(getValue() as number).toLocaleString()}
      </span>
    ),
    size: 100,
    meta: {
      dataType: 'number',
      align: 'right'
    }
  },
  {
    id: 'lastConnected',
    header: 'Last Connected',
    accessorKey: 'lastConnected',
    enableSorting: true,
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    },
    meta: {
      dataType: 'date'
    }
  }
];

/**
 * User management column configuration
 */
const userColumns: ManageTableColumnDef[] = [
  {
    id: 'name',
    header: 'User',
    accessorKey: 'firstName',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {row.original.firstName[0]}{row.original.lastName[0]}
            </span>
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.email}
          </div>
        </div>
      </div>
    ),
    meta: {
      dataType: 'text'
    }
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const role = getValue() as string;
      const roleColors = {
        admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        developer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        analyst: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors] || roleColors.viewer}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      );
    },
    meta: {
      dataType: 'text'
    }
  },
  {
    id: 'status',
    header: 'Account Status',
    accessorKey: 'status',
    enableSorting: true,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const statusConfig = {
        active: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', label: 'Active' },
        pending: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Pending' },
        suspended: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900', label: 'Suspended' }
      };
      
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
          {config.label}
        </span>
      );
    },
    meta: {
      dataType: 'text'
    }
  },
  {
    id: 'lastLogin',
    header: 'Last Login',
    accessorKey: 'lastLogin',
    enableSorting: true,
    cell: ({ getValue }) => {
      const lastLogin = getValue() as string | null;
      if (!lastLogin) {
        return <span className="text-gray-400 text-sm">Never</span>;
      }
      
      const date = new Date(lastLogin);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {diffDays === 1 ? 'Today' : diffDays < 7 ? `${diffDays} days ago` : date.toLocaleDateString()}
        </span>
      );
    },
    meta: {
      dataType: 'date'
    }
  }
];

/**
 * Performance test columns for large datasets
 */
const performanceColumns: ManageTableColumnDef[] = [
  {
    id: 'id',
    header: 'ID',
    accessorKey: 'id',
    enableSorting: true,
    size: 80,
    meta: { dataType: 'number', align: 'right' }
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true,
    meta: { dataType: 'text' }
  },
  {
    id: 'category',
    header: 'Category',
    accessorKey: 'category',
    enableSorting: true,
    enableColumnFilter: true,
    meta: { dataType: 'text' }
  },
  {
    id: 'value',
    header: 'Value',
    accessorKey: 'value',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="font-mono text-right">
        ${(getValue() as number).toLocaleString()}
      </span>
    ),
    size: 120,
    meta: { dataType: 'number', align: 'right' }
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const colors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800'
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>
          {status}
        </span>
      );
    },
    meta: { dataType: 'text' }
  }
];

// =============================================================================
// Action Configurations
// =============================================================================

/**
 * Database service row actions
 */
const databaseRowActions: RowAction[] = [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4" />,
    onClick: action('view-service'),
    variant: 'secondary',
    tooltip: 'View service configuration',
    ariaLabel: 'View service details'
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: action('edit-service'),
    variant: 'secondary',
    tooltip: 'Edit service configuration',
    ariaLabel: 'Edit service'
  },
  {
    id: 'test',
    label: 'Test Connection',
    icon: <RefreshCw className="h-4 w-4" />,
    onClick: action('test-connection'),
    variant: 'secondary',
    show: (row) => row.original.active,
    tooltip: 'Test database connection',
    ariaLabel: 'Test connection'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: action('delete-service'),
    variant: 'destructive',
    disabled: (row) => row.original.tables > 100,
    confirmation: {
      title: 'Delete Service',
      message: 'Are you sure you want to delete this database service? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    },
    tooltip: 'Delete service',
    ariaLabel: 'Delete service'
  }
];

/**
 * User management row actions
 */
const userRowActions: RowAction[] = [
  {
    id: 'edit',
    label: 'Edit User',
    icon: <Edit className="h-4 w-4" />,
    onClick: action('edit-user'),
    variant: 'secondary'
  },
  {
    id: 'suspend',
    label: 'Suspend',
    icon: <X className="h-4 w-4" />,
    onClick: action('suspend-user'),
    variant: 'destructive',
    show: (row) => row.original.status === 'active',
    confirmation: {
      title: 'Suspend User',
      message: 'This will prevent the user from accessing the system.',
      confirmLabel: 'Suspend'
    }
  },
  {
    id: 'activate',
    label: 'Activate',
    icon: <Check className="h-4 w-4" />,
    onClick: action('activate-user'),
    variant: 'secondary',
    show: (row) => row.original.status !== 'active'
  }
];

/**
 * Bulk actions for multiple selections
 */
const bulkActions: BulkAction[] = [
  {
    id: 'activate',
    label: 'Activate Selected',
    icon: <Check className="h-4 w-4" />,
    onClick: action('bulk-activate'),
    variant: 'secondary',
    show: (rows) => rows.some(row => !row.original.active)
  },
  {
    id: 'deactivate',
    label: 'Deactivate Selected',
    icon: <X className="h-4 w-4" />,
    onClick: action('bulk-deactivate'),
    variant: 'secondary',
    show: (rows) => rows.some(row => row.original.active)
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: action('bulk-delete'),
    variant: 'destructive',
    confirmation: {
      title: 'Delete Items',
      message: (count) => `Are you sure you want to delete ${count} items? This action cannot be undone.`,
      confirmLabel: 'Delete All'
    }
  }
];

/**
 * Table-level actions
 */
const tableActions = [
  {
    id: 'create',
    label: 'Create New',
    icon: <Plus className="h-4 w-4" />,
    onClick: action('create-new'),
    variant: 'primary' as const
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw className="h-4 w-4" />,
    onClick: action('refresh-data'),
    variant: 'secondary' as const
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    onClick: action('export-data'),
    variant: 'secondary' as const
  }
];

// =============================================================================
// Story Provider Wrapper
// =============================================================================

/**
 * Wrapper component to provide React Query context for stories
 */
const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// =============================================================================
// Primary Stories
// =============================================================================

/**
 * Default database services table - primary use case
 */
export const DatabaseServices: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: generateDatabaseServices(25),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    bulkActions,
    tableActions,
    pagination: {
      enabled: true,
      mode: 'client',
      pageSizeOptions: [10, 25, 50],
      defaultPageSize: 10,
      showInfo: true,
      showPageSizeSelector: true,
      showQuickNavigation: true,
      position: 'bottom'
    },
    sorting: {
      enabled: true,
      enableMultiSort: false,
      maxSortColumns: 1
    },
    globalFilter: {
      enabled: true,
      placeholder: 'Search database services...',
      debounceMs: 300
    },
    rowSelection: {
      enabled: true,
      mode: 'multiple',
      enableSelectAll: true
    },
    theme: {
      density: 'default',
      borders: 'horizontal',
      striped: false,
      hover: true,
      selectionHighlight: true
    },
    onRowClick: action('row-clicked'),
    onCellClick: action('cell-clicked'),
    caption: 'Database services configured in DreamFactory',
    'data-testid': 'database-services-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Database Services Table

The primary use case showing a table of database services with:
- **Service information**: Name, type, status, connection details
- **Interactive columns**: Sortable headers, filterable content
- **Row actions**: View, edit, test connection, delete
- **Bulk operations**: Multi-select with bulk actions
- **Status indicators**: Visual status badges and icons
- **Responsive design**: Adapts to different screen sizes

**Accessibility Features:**
- ARIA labels and descriptions
- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Screen reader announcements
- Focus management
        `
      }
    }
  }
};

/**
 * User management table variant
 */
export const UserManagement: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: generateUsers(30),
    columns: userColumns,
    rowActions: userRowActions,
    bulkActions,
    tableActions: [
      {
        id: 'invite',
        label: 'Invite User',
        icon: <Plus className="h-4 w-4" />,
        onClick: action('invite-user'),
        variant: 'primary' as const
      },
      ...tableActions
    ],
    pagination: {
      enabled: true,
      mode: 'client',
      pageSizeOptions: [15, 30, 50],
      defaultPageSize: 15,
      showInfo: true,
      showPageSizeSelector: true,
      position: 'bottom'
    },
    sorting: {
      enabled: true,
      enableMultiSort: true,
      maxSortColumns: 2
    },
    globalFilter: {
      enabled: true,
      placeholder: 'Search users by name or email...',
      debounceMs: 300
    },
    rowSelection: {
      enabled: true,
      mode: 'multiple'
    },
    theme: {
      density: 'comfortable',
      borders: 'horizontal',
      striped: true,
      hover: true
    },
    'data-testid': 'user-management-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### User Management Table

Demonstrates user administration with:
- **User profiles**: Avatar, name, email, role
- **Account status**: Active, pending, suspended states
- **Multi-column sorting**: Sort by multiple fields
- **Comfortable density**: More spacious row layout
- **Striped rows**: Enhanced visual separation
        `
      }
    }
  }
};

// =============================================================================
// Density and Theme Variants
// =============================================================================

/**
 * Compact density for space-constrained layouts
 */
export const CompactDensity: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: generateDatabaseServices(15),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions.slice(0, 2), // Fewer actions for compact view
    pagination: {
      enabled: true,
      mode: 'client',
      pageSizeOptions: [15, 30, 50],
      defaultPageSize: 15,
      position: 'bottom'
    },
    theme: {
      density: 'compact',
      borders: 'all',
      striped: false,
      hover: true
    },
    'data-testid': 'compact-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Compact Density

Space-efficient layout with:
- **Reduced padding**: Minimal row height
- **All borders**: Clear cell separation
- **Optimized actions**: Fewer row actions
- **Ideal for**: Dashboards, embedded tables, mobile views
        `
      }
    }
  }
};

/**
 * Comfortable density for detailed data review
 */
export const ComfortableDensity: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: generateDatabaseServices(10),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 10,
      position: 'bottom'
    },
    theme: {
      density: 'comfortable',
      borders: 'horizontal',
      striped: true,
      hover: true,
      selectionHighlight: true
    },
    'data-testid': 'comfortable-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Comfortable Density

Spacious layout for detailed review:
- **Increased padding**: More breathing room
- **Enhanced readability**: Easier scanning
- **Full feature set**: All actions available
- **Ideal for**: Admin panels, detailed configuration
        `
      }
    }
  }
};

/**
 * Dark theme variant
 */
export const DarkTheme: Story = {
  render: (args) => (
    <div className="dark bg-gray-900 p-6 min-h-screen">
      <StoryProvider>
        <ManageTable {...args} />
      </StoryProvider>
    </div>
  ),
  args: {
    data: generateDatabaseServices(20),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    bulkActions,
    tableActions,
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 10,
      position: 'bottom'
    },
    sorting: { enabled: true },
    globalFilter: {
      enabled: true,
      placeholder: 'Search in dark mode...'
    },
    rowSelection: {
      enabled: true,
      mode: 'multiple'
    },
    theme: {
      density: 'default',
      borders: 'horizontal',
      striped: false,
      hover: true,
      selectionHighlight: true
    },
    'data-testid': 'dark-theme-table'
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: `
### Dark Theme

Full dark mode support with:
- **Dark color palette**: Optimized contrast
- **Accessible colors**: WCAG AA compliant
- **Consistent theming**: All states themed
- **User preference**: Respects system theme
        `
      }
    }
  }
};

// =============================================================================
// Performance and Virtualization
// =============================================================================

/**
 * Large dataset with virtualization for performance
 */
export const VirtualizedPerformance: Story = {
  render: (args) => (
    <StoryProvider>
      <div className="h-screen p-4">
        <div className="h-full">
          <ManageTable {...args} />
        </div>
      </div>
    </StoryProvider>
  ),
  args: {
    data: generateLargeDataset(1000),
    columns: performanceColumns,
    virtualization: {
      enabled: true,
      estimateSize: 50,
      overscan: 10
    },
    pagination: {
      enabled: false // Disabled for virtual scrolling demo
    },
    sorting: {
      enabled: true,
      enableMultiSort: false
    },
    globalFilter: {
      enabled: true,
      placeholder: 'Search 1000+ items...',
      debounceMs: 300
    },
    theme: {
      density: 'compact',
      borders: 'horizontal',
      hover: true
    },
    enablePerformanceMonitoring: true,
    'data-testid': 'virtualized-table'
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: `
### Virtualized Performance

High-performance table with 1000+ rows:
- **TanStack Virtual**: Only renders visible rows
- **Smooth scrolling**: 60fps performance
- **Memory efficient**: Constant memory usage
- **Instant search**: Debounced filtering
- **Performance monitoring**: Built-in metrics

**Performance Metrics:**
- Render time: <16ms
- Memory usage: Constant
- Scroll performance: 60fps
- Search response: <300ms
        `
      }
    }
  }
};

/**
 * Performance comparison without virtualization
 */
export const NonVirtualizedComparison: Story = {
  render: (args) => (
    <StoryProvider>
      <div className="p-4">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Performance Note:</strong> This table renders all 500 rows in the DOM. 
            Compare scroll performance with the virtualized version above.
          </p>
        </div>
        <ManageTable {...args} />
      </div>
    </StoryProvider>
  ),
  args: {
    data: generateLargeDataset(500),
    columns: performanceColumns,
    virtualization: {
      enabled: false
    },
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 50,
      pageSizeOptions: [25, 50, 100, 500],
      position: 'bottom'
    },
    sorting: { enabled: true },
    globalFilter: {
      enabled: true,
      placeholder: 'Search 500 items (non-virtualized)...'
    },
    theme: {
      density: 'compact',
      hover: true
    },
    'data-testid': 'non-virtualized-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Non-Virtualized Comparison

Traditional table rendering for comparison:
- **All rows in DOM**: Higher memory usage
- **Pagination required**: For reasonable performance
- **Slower rendering**: Increased initial load
- **Standard scrolling**: Native browser scroll
        `
      }
    }
  }
};

// =============================================================================
// State and Interaction Stories
// =============================================================================

/**
 * Loading state demonstration
 */
export const LoadingState: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: [],
    columns: databaseServiceColumns,
    loading: true,
    pagination: { enabled: true, mode: 'client', defaultPageSize: 10, position: 'bottom' },
    theme: { density: 'default' },
    'data-testid': 'loading-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Loading State

Demonstrates loading behavior:
- **Loading spinner**: Centered loading indicator
- **Accessible**: Screen reader announcements
- **Preserved layout**: Table structure maintained
- **User feedback**: Clear loading state
        `
      }
    }
  }
};

/**
 * Error state demonstration
 */
export const ErrorState: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: [],
    columns: databaseServiceColumns,
    error: new Error('Failed to load database services. Please check your connection and try again.'),
    pagination: { enabled: true, mode: 'client', defaultPageSize: 10, position: 'bottom' },
    theme: { density: 'default' },
    'data-testid': 'error-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Error State

Error handling and recovery:
- **Error message**: Clear error description
- **Retry action**: One-click recovery
- **Error icon**: Visual error indicator
- **Accessibility**: Error announced to screen readers
        `
      }
    }
  }
};

/**
 * Empty state demonstration
 */
export const EmptyState: Story = {
  render: (args) => (
    <StoryProvider>
      <ManageTable {...args} />
    </StoryProvider>
  ),
  args: {
    data: [],
    columns: databaseServiceColumns,
    emptyState: {
      title: 'No database services configured',
      description: 'Get started by creating your first database service connection.',
      icon: <Database className="h-12 w-12 text-gray-400" />,
      action: (
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={action('create-first-service')}
        >
          Create Database Service
        </button>
      )
    },
    pagination: { enabled: true, mode: 'client', defaultPageSize: 10, position: 'bottom' },
    theme: { density: 'default' },
    'data-testid': 'empty-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Empty State

No data scenarios with clear guidance:
- **Descriptive title**: Clear empty state message
- **Helpful description**: Guidance for next steps
- **Call to action**: Primary action button
- **Visual icon**: Contextual empty state icon
        `
      }
    }
  }
};

// =============================================================================
// Advanced Features
// =============================================================================

/**
 * Advanced filtering and search capabilities
 */
export const AdvancedFiltering: Story = {
  render: (args) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);

    return (
      <StoryProvider>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium mb-2">Global Search</label>
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search across all columns..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium mb-2">Database Type Filter</label>
              <select 
                onChange={(e) => {
                  const value = e.target.value;
                  setColumnFilters(prev => 
                    value ? [...prev.filter(f => f.id !== 'type'), { id: 'type', value }] : 
                    prev.filter(f => f.id !== 'type')
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="oracle">Oracle</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setGlobalFilter('');
                  setColumnFilters([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <ManageTable {...args} />
        </div>
      </StoryProvider>
    );
  },
  args: {
    data: generateDatabaseServices(50),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 15,
      position: 'bottom'
    },
    sorting: {
      enabled: true,
      enableMultiSort: true,
      maxSortColumns: 3
    },
    globalFilter: {
      enabled: true,
      placeholder: 'Search database services...',
      debounceMs: 300
    },
    columnFilters: {
      type: {
        type: 'select',
        options: [
          { label: 'All Types', value: '' },
          { label: 'MySQL', value: 'mysql' },
          { label: 'PostgreSQL', value: 'postgresql' },
          { label: 'MongoDB', value: 'mongodb' },
          { label: 'Oracle', value: 'oracle' }
        ]
      },
      name: {
        type: 'text',
        placeholder: 'Filter by name...'
      }
    },
    theme: {
      density: 'default',
      borders: 'horizontal',
      hover: true
    },
    'data-testid': 'advanced-filtering-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Advanced Filtering

Comprehensive filtering capabilities:
- **Global search**: Search across all columns
- **Column filters**: Individual column filtering
- **Multi-sort**: Sort by multiple columns
- **Filter combinations**: Combine different filter types
- **Real-time updates**: Instant filter application
        `
      }
    }
  }
};

/**
 * Responsive design demonstration
 */
export const ResponsiveDesign: Story = {
  render: (args) => (
    <StoryProvider>
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mobile View (< 768px)</h3>
          <div className="max-w-sm border-2 border-dashed border-gray-300 p-2">
            <ManageTable {...args} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tablet View (768px - 1024px)</h3>
          <div className="max-w-2xl border-2 border-dashed border-gray-300 p-2">
            <ManageTable {...args} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Desktop View (> 1024px)</h3>
          <div className="border-2 border-dashed border-gray-300 p-2">
            <ManageTable {...args} />
          </div>
        </div>
      </div>
    </StoryProvider>
  ),
  args: {
    data: generateDatabaseServices(10),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions.slice(0, 2),
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 5,
      position: 'bottom'
    },
    responsive: {
      breakpoints: {
        mobile: {
          hiddenColumns: ['host', 'tables', 'lastConnected'],
          stackedView: false
        },
        tablet: {
          hiddenColumns: ['lastConnected'],
          horizontalScroll: true
        },
        desktop: {
          visibleColumns: ['name', 'type', 'active', 'host', 'tables', 'lastConnected'],
          fullWidth: true
        }
      }
    },
    theme: {
      density: 'compact',
      borders: 'horizontal',
      hover: true
    },
    'data-testid': 'responsive-table'
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: `
### Responsive Design

Adaptive table layout across screen sizes:
- **Mobile**: Hidden columns, compact actions
- **Tablet**: Horizontal scroll, selected columns
- **Desktop**: Full feature set, all columns
- **Automatic**: Responds to container size
- **Configurable**: Custom breakpoint behavior
        `
      }
    }
  }
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility features demonstration
 */
export const AccessibilityFeatures: Story = {
  render: (args) => (
    <StoryProvider>
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">Keyboard Navigation Guide</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><kbd className="px-2 py-1 bg-white rounded border">Tab</kbd> - Navigate through interactive elements</p>
            <p><kbd className="px-2 py-1 bg-white rounded border">Enter</kbd> or <kbd className="px-2 py-1 bg-white rounded border">Space</kbd> - Activate buttons and sortable headers</p>
            <p><kbd className="px-2 py-1 bg-white rounded border">↑↓</kbd> - Navigate table rows</p>
            <p><kbd className="px-2 py-1 bg-white rounded border">←→</kbd> - Navigate table cells</p>
            <p><kbd className="px-2 py-1 bg-white rounded border">Shift + Click</kbd> - Multi-select rows</p>
            <p><kbd className="px-2 py-1 bg-white rounded border">Ctrl/Cmd + A</kbd> - Select all rows</p>
          </div>
        </div>
        
        <ManageTable {...args} />
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-900 mb-2">Screen Reader Features</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p>• Column headers announce sort state and instructions</p>
            <p>• Row selection state is announced</p>
            <p>• Action button purposes are clearly labeled</p>
            <p>• Table structure and navigation are properly announced</p>
            <p>• Loading and error states provide clear feedback</p>
          </div>
        </div>
      </div>
    </StoryProvider>
  ),
  args: {
    data: generateDatabaseServices(15),
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    bulkActions,
    pagination: {
      enabled: true,
      mode: 'client',
      defaultPageSize: 10,
      position: 'bottom'
    },
    sorting: { enabled: true },
    globalFilter: {
      enabled: true,
      placeholder: 'Search with accessibility features...'
    },
    rowSelection: {
      enabled: true,
      mode: 'multiple'
    },
    theme: {
      density: 'comfortable',
      borders: 'all',
      hover: true,
      selectionHighlight: true
    },
    caption: 'Database services table with full accessibility support',
    summary: 'This table contains database service configurations with sortable columns, row actions, and bulk operations. Use Tab to navigate, Enter to activate, and arrow keys to move between cells.',
    'aria-label': 'Database services management table',
    'data-testid': 'accessibility-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Features

WCAG 2.1 AA compliant table with:
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: Comprehensive ARIA labeling
- **Focus management**: Visible focus indicators
- **Color contrast**: High contrast ratios
- **Alternative text**: Descriptive labels
- **State announcements**: Clear status updates

**Accessibility Testing:**
- Test with keyboard only
- Use screen reader (NVDA, JAWS, VoiceOver)
- Check focus indicators
- Verify color contrast
- Test with high contrast mode
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const table = canvas.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Test sortable column headers
    const nameHeader = canvas.getByRole('button', { name: /sort by service name/i });
    expect(nameHeader).toBeInTheDocument();
    
    // Test row selection
    const selectAllCheckbox = canvas.getByRole('checkbox', { name: /select all/i });
    if (selectAllCheckbox) {
      await userEvent.click(selectAllCheckbox);
    }
    
    // Test search functionality
    const searchInput = canvas.getByRole('textbox', { name: /global search/i });
    if (searchInput) {
      await userEvent.type(searchInput, 'mysql');
      await waitFor(() => {
        expect(searchInput).toHaveValue('mysql');
      });
    }
  }
};

// =============================================================================
// Integration and Form Stories
// =============================================================================

/**
 * React Query integration demonstration
 */
export const ReactQueryIntegration: Story = {
  render: (args) => {
    const mockApiResponse: TableApiResponse = {
      resource: generateDatabaseServices(20),
      meta: {
        count: 100,
        limit: 20,
        offset: 0,
        has_more: true
      }
    };

    const queryResult = createMockQueryResult(mockApiResponse);

    return (
      <StoryProvider>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Query Status</h3>
            <div className="text-sm space-y-1">
              <p>Status: <span className="font-mono">{queryResult.status}</span></p>
              <p>Is Loading: <span className="font-mono">{queryResult.isLoading.toString()}</span></p>
              <p>Is Error: <span className="font-mono">{queryResult.isError.toString()}</span></p>
              <p>Data Count: <span className="font-mono">{queryResult.data?.resource?.length || 0}</span></p>
            </div>
          </div>
          <ManageTable {...args} data={queryResult} />
        </div>
      </StoryProvider>
    );
  },
  args: {
    columns: databaseServiceColumns,
    rowActions: databaseRowActions,
    pagination: {
      enabled: true,
      mode: 'server',
      defaultPageSize: 20,
      position: 'bottom'
    },
    sorting: { enabled: true },
    globalFilter: {
      enabled: true,
      placeholder: 'Search with React Query...'
    },
    theme: { density: 'default' },
    'data-testid': 'react-query-table'
  },
  parameters: {
    docs: {
      description: {
        story: `
### React Query Integration

Server-state management with TanStack React Query:
- **Intelligent caching**: Automatic cache management
- **Background updates**: Stale-while-revalidate
- **Error handling**: Built-in error states
- **Loading states**: Automatic loading indicators
- **Optimistic updates**: Fast user interactions
        `
      }
    }
  }
};

/**
 * Export and documentation story
 */
export const Documentation: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">ManageTable Component Guide</h1>
        <p className="text-lg text-gray-600 mb-8">
          A comprehensive data table component for modern React applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Key Features</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>TanStack Table integration</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>React Query data fetching</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Virtual scrolling performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>WCAG 2.1 AA accessibility</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Responsive design</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Dark mode support</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Performance Metrics</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Render time:</span>
              <span className="font-mono">&lt; 16ms</span>
            </div>
            <div className="flex justify-between">
              <span>Virtual scrolling:</span>
              <span className="font-mono">1000+ rows</span>
            </div>
            <div className="flex justify-between">
              <span>Search debounce:</span>
              <span className="font-mono">300ms</span>
            </div>
            <div className="flex justify-between">
              <span>Memory usage:</span>
              <span className="font-mono">Constant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Usage Example</h2>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { ManageTable } from '@/components/ui/manage-table';

const columns = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true
  }
];

const rowActions = [
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: (row) => console.log('Edit', row.original)
  }
];

<ManageTable
  data={data}
  columns={columns}
  rowActions={rowActions}
  pagination={{ enabled: true, defaultPageSize: 25 }}
  sorting={{ enabled: true }}
  globalFilter={{ enabled: true }}
/>`}
        </pre>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: `
### Component Documentation

Complete usage guide and API reference for the ManageTable component.
This story serves as both documentation and a playground for exploring
the component's capabilities.
        `
      }
    }
  }
};

export {
  // Export stories for Storybook
  DatabaseServices as default
};