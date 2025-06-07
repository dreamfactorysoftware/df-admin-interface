/**
 * Database Service List Table Component
 * 
 * React table component for displaying and managing database services in a paginated, 
 * filterable table format. Implements service listing functionality using React Query 
 * for data fetching, Headless UI for accessible table components, and Tailwind CSS 
 * for styling. Provides CRUD operations including delete functionality with optimistic 
 * updates and handles large datasets with virtual scrolling.
 * 
 * Key Features:
 * - React 19 stable features with TypeScript 5.8+ per Section 7.1.1
 * - SWR/React Query for intelligent caching and synchronization 
 * - TanStack Virtual for virtualization and progressive loading patterns optimized for 1000+ services
 * - React Hook Form for configuration workflows with real-time validation under 100ms
 * - Tailwind CSS 4.1+ with consistent theme injection across components
 * - Headless UI 2.0+ for accessible, unstyled components
 * - Database service CRUD operations maintaining existing API compatibility per F-001 requirements
 * - Optimistic updates for delete operations using React Query mutations
 * - Comprehensive error handling and accessibility compliance
 * 
 * @fileoverview Service list table component migrated from Angular to React/Next.js
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { 
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
  Checkbox,
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Description
} from '@headlessui/react';
import { 
  EllipsisVerticalIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Square3Stack3DIcon,
  TableCellsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../../../lib/utils';

// Type imports from dependencies
import type { 
  DatabaseService,
  ServiceListTableProps,
  ServiceListColumn,
  ServiceListFilterData,
  ServiceListSortData,
  ServiceListPaginationData,
  ServiceListRowSelection,
  ServiceListAction,
  DatabaseDriver,
  ServiceStatus,
  BulkAction,
  ConnectionTestResult,
  VirtualTableConfig,
  VirtualServiceItem
} from './service-list-types';

import { 
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  DATABASE_TYPE_LABELS,
  ServiceListFilterSchema,
  ServiceListSortSchema,
  isValidSortField,
  formatServiceStatus,
  getServiceStatusColor
} from './service-list-types';

// Hook imports
import { 
  useServiceList,
  useServiceListFilters,
  useServiceListSelection,
  useServiceListVirtualization,
  useServiceListMutations,
  useServiceConnectionStatus
} from './service-list-hooks';

import { useServiceListStore } from './service-list-hooks';

// Constants imports
import { 
  DATABASE_DRIVERS,
  COMPONENT_CONFIG,
  VALIDATION_RULES
} from '../constants';

// =============================================================================
// FILTER FORM SCHEMA AND TYPES
// =============================================================================

/**
 * Filter form schema for table controls
 */
const FilterFormSchema = z.object({
  search: z.string().optional(),
  type: z.array(z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite'])).optional(),
  status: z.array(z.enum(['active', 'inactive'])).optional(),
  showInactive: z.boolean().default(false),
});

type FilterFormData = z.infer<typeof FilterFormSchema>;

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

/**
 * Default column configuration for service list table
 */
const DEFAULT_COLUMNS: ServiceListColumn[] = [
  {
    id: 'selection',
    header: '',
    accessor: 'id',
    width: '48px',
    minWidth: 48,
    maxWidth: 48,
    sortable: false,
    filterable: false,
    resizable: false,
    sticky: 'left',
    required: true,
    className: 'w-12 text-center',
  },
  {
    id: 'name',
    header: 'Service Name',
    accessor: 'name',
    width: '200px',
    minWidth: 150,
    sortable: true,
    filterable: true,
    className: 'font-medium text-gray-900 dark:text-gray-100',
  },
  {
    id: 'type',
    header: 'Type',
    accessor: 'type',
    width: '120px',
    minWidth: 100,
    sortable: true,
    filterable: true,
    className: 'text-gray-700 dark:text-gray-300',
  },
  {
    id: 'label',
    header: 'Display Label',
    accessor: 'label',
    width: '180px',
    minWidth: 120,
    sortable: true,
    filterable: false,
    className: 'text-gray-700 dark:text-gray-300',
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'is_active',
    width: '100px',
    minWidth: 80,
    sortable: true,
    filterable: true,
    align: 'center',
    className: 'text-center',
  },
  {
    id: 'connection_status',
    header: 'Connection',
    accessor: (service) => service.id,
    width: '120px',
    minWidth: 100,
    sortable: false,
    filterable: false,
    align: 'center',
    className: 'text-center',
  },
  {
    id: 'created_date',
    header: 'Created',
    accessor: 'created_date',
    width: '140px',
    minWidth: 120,
    sortable: true,
    filterable: false,
    className: 'text-gray-600 dark:text-gray-400',
  },
  {
    id: 'last_modified_date',
    header: 'Modified',
    accessor: 'last_modified_date',
    width: '140px',
    minWidth: 120,
    sortable: true,
    filterable: false,
    className: 'text-gray-600 dark:text-gray-400',
  },
  {
    id: 'actions',
    header: 'Actions',
    accessor: 'id',
    width: '120px',
    minWidth: 100,
    maxWidth: 120,
    sortable: false,
    filterable: false,
    resizable: false,
    sticky: 'right',
    required: true,
    align: 'center',
    className: 'text-center',
  },
];

// =============================================================================
// BULK ACTIONS CONFIGURATION
// =============================================================================

/**
 * Available bulk actions for selected services
 */
const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'activate',
    label: 'Activate Services',
    icon: CheckIcon,
    variant: 'default',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to activate the selected services?',
  },
  {
    id: 'deactivate',
    label: 'Deactivate Services',
    icon: XMarkIcon,
    variant: 'warning',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to deactivate the selected services?',
  },
  {
    id: 'test-connection',
    label: 'Test Connections',
    icon: PlayIcon,
    variant: 'default',
    requiresConfirmation: false,
  },
  {
    id: 'delete',
    label: 'Delete Services',
    icon: TrashIcon,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected services? This action cannot be undone.',
  },
];

// =============================================================================
// COMPONENT SUBCOMPONENTS
// =============================================================================

/**
 * Service Status Badge Component
 */
interface ServiceStatusBadgeProps {
  service: DatabaseService;
  className?: string;
}

const ServiceStatusBadge: React.FC<ServiceStatusBadgeProps> = ({ service, className }) => {
  const status: ServiceStatus = service.is_active ? 'active' : 'inactive';
  const statusColor = getServiceStatusColor(status);
  const statusLabel = formatServiceStatus(status);

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusColor === 'green' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
        statusColor === 'gray' && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
        statusColor === 'red' && 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
        statusColor === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
        statusColor === 'blue' && 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
        className
      )}
      title={`Service is ${statusLabel.toLowerCase()}`}
    >
      {statusLabel}
    </span>
  );
};

/**
 * Connection Status Indicator Component
 */
interface ConnectionStatusIndicatorProps {
  serviceId: number;
  className?: string;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ serviceId, className }) => {
  const { connectionStatus, isLoading, error, testConnection } = useServiceConnectionStatus(serviceId);

  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <div className="inline-flex items-center">
          <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-500" />
          <span className="sr-only">Testing connection...</span>
        </div>
      );
    }

    if (error || !connectionStatus) {
      return (
        <div className="inline-flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
          <span className="sr-only">Connection failed</span>
        </div>
      );
    }

    if (connectionStatus.success) {
      return (
        <div className="inline-flex items-center">
          <CheckIcon className="h-4 w-4 text-green-500" />
          <span className="sr-only">Connection successful</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center">
        <XMarkIcon className="h-4 w-4 text-red-500" />
        <span className="sr-only">Connection failed</span>
      </div>
    );
  };

  return (
    <button
      onClick={() => testConnection()}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={`Test connection for service ${serviceId}`}
    >
      {getStatusIcon()}
    </button>
  );
};

/**
 * Service Actions Menu Component
 */
interface ServiceActionsMenuProps {
  service: DatabaseService;
  onEdit: (service: DatabaseService) => void;
  onDelete: (service: DatabaseService) => void;
  onDuplicate: (service: DatabaseService) => void;
  onTestConnection: (service: DatabaseService) => void;
  disabled?: boolean;
}

const ServiceActionsMenu: React.FC<ServiceActionsMenuProps> = ({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onTestConnection,
  disabled = false
}) => {
  const actions: ServiceListAction[] = [
    {
      id: 'test',
      label: 'Test Connection',
      icon: PlayIcon,
      onClick: () => onTestConnection(service),
      variant: 'default',
    },
    {
      id: 'edit',
      label: 'Edit Service',
      icon: PencilIcon,
      onClick: () => onEdit(service),
      variant: 'default',
    },
    {
      id: 'duplicate',
      label: 'Duplicate Service',
      icon: DocumentDuplicateIcon,
      onClick: () => onDuplicate(service),
      variant: 'default',
    },
    {
      id: 'delete',
      label: 'Delete Service',
      icon: TrashIcon,
      onClick: () => onDelete(service),
      variant: 'destructive',
      requiresConfirmation: true,
    },
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title={`Actions for ${service.name}`}
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="sr-only">Service actions</span>
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {actions.map((action) => (
            <MenuItem key={action.id}>
              {({ focus }) => (
                <button
                  onClick={action.onClick}
                  className={cn(
                    'group flex items-center px-4 py-2 text-sm w-full text-left transition-colors',
                    focus 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-300',
                    action.variant === 'destructive' 
                      ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                      : ''
                  )}
                >
                  {action.icon && (
                    <action.icon 
                      className={cn(
                        'mr-3 h-4 w-4',
                        action.variant === 'destructive' 
                          ? 'text-red-500 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      )} 
                    />
                  )}
                  {action.label}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
};

/**
 * Table Header Component
 */
interface TableHeaderProps {
  columns: ServiceListColumn[];
  sort?: ServiceListSortData;
  onSortChange?: (sort: ServiceListSortData) => void;
  selection?: ServiceListRowSelection;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  sort,
  onSortChange,
  selection,
  className
}) => {
  const handleSort = useCallback((columnId: string) => {
    if (!onSortChange || !isValidSortField(columnId)) return;

    const newSort: ServiceListSortData = {
      field: columnId as any,
      direction: sort?.field === columnId && sort.direction === 'asc' ? 'desc' : 'asc'
    };

    onSortChange(newSort);
  }, [sort, onSortChange]);

  const getSortIcon = (columnId: string) => {
    if (sort?.field !== columnId) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-primary-600" />
      : <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };

  return (
    <thead className={cn('bg-gray-50 dark:bg-gray-800', className)}>
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            className={cn(
              'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.sticky === 'left' && 'sticky left-0 z-10 bg-gray-50 dark:bg-gray-800',
              column.sticky === 'right' && 'sticky right-0 z-10 bg-gray-50 dark:bg-gray-800',
              column.headerClassName
            )}
            style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }}
          >
            {column.id === 'selection' && selection?.mode === 'multiple' ? (
              <Checkbox
                checked={selection.selectAllState === 'all'}
                indeterminate={selection.selectAllState === 'some'}
                onChange={(checked) => selection.onSelectAll?.(checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
              />
            ) : column.sortable ? (
              <button
                onClick={() => handleSort(column.id)}
                className="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                <span>{column.header}</span>
                {getSortIcon(column.id)}
              </button>
            ) : (
              <span>{column.header}</span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

/**
 * Table Row Component
 */
interface TableRowProps {
  service: DatabaseService;
  columns: ServiceListColumn[];
  index: number;
  selected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onRowClick?: (service: DatabaseService) => void;
  onEdit: (service: DatabaseService) => void;
  onDelete: (service: DatabaseService) => void;
  onDuplicate: (service: DatabaseService) => void;
  onTestConnection: (service: DatabaseService) => void;
  style?: React.CSSProperties;
  className?: string;
}

const TableRow: React.FC<TableRowProps> = ({
  service,
  columns,
  index,
  selected = false,
  onSelectionChange,
  onRowClick,
  onEdit,
  onDelete,
  onDuplicate,
  onTestConnection,
  style,
  className
}) => {
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const formatDatabaseType = useCallback((type: DatabaseDriver) => {
    return DATABASE_TYPE_LABELS[type] || type;
  }, []);

  const getCellContent = useCallback((column: ServiceListColumn, service: DatabaseService) => {
    switch (column.id) {
      case 'selection':
        return (
          <Checkbox
            checked={selected}
            onChange={onSelectionChange}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            aria-label={`Select ${service.name}`}
          />
        );

      case 'name':
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{service.name}</div>
            {service.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={service.description}>
                {service.description}
              </div>
            )}
          </div>
        );

      case 'type':
        return (
          <span className="inline-flex items-center rounded-md bg-primary-50 dark:bg-primary-900 px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
            {formatDatabaseType(service.type)}
          </span>
        );

      case 'label':
        return service.label || service.name;

      case 'status':
        return <ServiceStatusBadge service={service} />;

      case 'connection_status':
        return <ConnectionStatusIndicator serviceId={service.id} />;

      case 'created_date':
        return formatDate(service.created_date);

      case 'last_modified_date':
        return formatDate(service.last_modified_date);

      case 'actions':
        return (
          <ServiceActionsMenu
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onTestConnection={onTestConnection}
          />
        );

      default:
        if (column.cell) {
          const value = typeof column.accessor === 'function'
            ? column.accessor(service)
            : service[column.accessor as keyof DatabaseService];
          return column.cell(value, service, index);
        }

        const value = typeof column.accessor === 'function'
          ? column.accessor(service)
          : service[column.accessor as keyof DatabaseService];

        return String(value || '—');
    }
  }, [selected, onSelectionChange, formatDate, formatDatabaseType, onEdit, onDelete, onDuplicate, onTestConnection, index]);

  return (
    <tr
      style={style}
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
        selected && 'bg-primary-50 dark:bg-primary-900/20',
        className
      )}
      onClick={() => onRowClick?.(service)}
    >
      {columns.map((column) => (
        <td
          key={column.id}
          className={cn(
            'px-6 py-4 whitespace-nowrap',
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right',
            column.sticky === 'left' && 'sticky left-0 z-10 bg-white dark:bg-gray-900',
            column.sticky === 'right' && 'sticky right-0 z-10 bg-white dark:bg-gray-900',
            selected && column.sticky && 'bg-primary-50 dark:bg-primary-900/20',
            column.cellClassName,
            column.className
          )}
        >
          {getCellContent(column, service)}
        </td>
      ))}
    </tr>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  message?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateService?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  hasFilters = false,
  onClearFilters,
  onCreateService,
  className
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      <Square3Stack3DIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
        {message || (hasFilters ? 'No services match your filters' : 'No database services')}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {hasFilters 
          ? 'Try adjusting your search criteria or filters.'
          : 'Get started by creating your first database service connection.'
        }
      </p>
      <div className="mt-6 flex justify-center space-x-3">
        {hasFilters && onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
          >
            Clear filters
          </Button>
        )}
        {onCreateService && (
          <Button
            onClick={onCreateService}
            variant="primary"
            size="sm"
          >
            Create service
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Loading State Component
 */
interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading services...',
  className
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      <ArrowPathIcon className="mx-auto h-8 w-8 text-primary-600 animate-spin" />
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

/**
 * Filter Controls Component
 */
interface FilterControlsProps {
  filters: ServiceListFilterData;
  onFiltersChange: (filters: ServiceListFilterData) => void;
  onClearFilters: () => void;
  className?: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className
}) => {
  const { control, watch, setValue } = useForm<FilterFormData>({
    resolver: zodResolver(FilterFormSchema),
    defaultValues: {
      search: filters.search || '',
      type: [],
      status: [],
      showInactive: false,
    },
  });

  const watchedValues = watch();

  // Update filters when form values change
  useEffect(() => {
    const newFilters: ServiceListFilterData = {
      search: watchedValues.search || undefined,
      type: watchedValues.type?.length ? watchedValues.type : undefined,
      status: watchedValues.status?.length ? watchedValues.status : undefined,
    };
    onFiltersChange(newFilters);
  }, [watchedValues, onFiltersChange]);

  const hasActiveFilters = !!(filters.search || filters.type?.length || filters.status?.length);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Controller
          name="search"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="Search services..."
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          )}
        />
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-3">
        <Controller
          name="showInactive"
          control={control}
          render={({ field }) => (
            <label className="inline-flex items-center">
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show inactive services
              </span>
            </label>
          )}
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setValue('search', '');
              setValue('type', []);
              setValue('status', []);
              setValue('showInactive', false);
              onClearFilters();
            }}
            variant="outline"
            size="sm"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Service List Table Component
 * 
 * Main table component for displaying and managing database services.
 * Implements pagination, filtering, sorting, virtual scrolling, and CRUD operations.
 */
export const ServiceListTable: React.FC<ServiceListTableProps> = ({
  services = [],
  loading = false,
  error = null,
  emptyMessage,
  emptyState: EmptyStateComponent,
  columns = DEFAULT_COLUMNS,
  selection,
  actions,
  bulkActions = BULK_ACTIONS,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  onRowHover,
  onKeyDown,
  sort,
  onSortChange,
  filters,
  onFilterChange,
  pagination,
  onPaginationChange,
  viewConfig,
  onViewConfigChange,
  virtualization,
  rowRenderer,
  loadingOverlay: LoadingOverlayComponent,
  errorOverlay: ErrorOverlayComponent,
  density = 'normal',
  bordered = true,
  striped = true,
  hoverable = true,
  focusable = true,
  autoFocus = false,
  ariaLabel = 'Database Services Table',
  ariaDescription = 'Table displaying database service connections with filtering and sorting capabilities',
  testId = 'service-list-table',
  className,
  'data-testid': dataTestId,
  ...props
}) => {
  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteService, setDeleteService] = useState<DatabaseService | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    action: BulkAction;
    services: DatabaseService[];
  } | null>(null);

  // Table container ref for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { 
    services: hookServices,
    isLoading: hookLoading,
    error: hookError,
    deleteService: deleteServiceMutation,
    deleteServices: deleteServicesMutation,
    testConnection: testConnectionMutation,
    toggleService: toggleServiceMutation,
    duplicateService: duplicateServiceMutation,
    refresh
  } = useServiceList();

  const {
    filters: storeFilters,
    setFilters,
    clearFilters,
    setSearch,
    setSorting
  } = useServiceListFilters();

  const {
    selectedServices,
    selectedCount,
    selectedServiceObjects,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleSelection,
    toggleSelectAll,
    selectAll,
    deselectAll
  } = useServiceListSelection();

  const {
    bulkAction: bulkActionMutation,
    isBulkActionInProgress
  } = useServiceListMutations();

  // Use provided data or hook data
  const displayServices = services.length > 0 ? services : hookServices;
  const isDataLoading = loading || hookLoading;
  const dataError = error || hookError;

  // Virtual scrolling setup
  const enableVirtualization = virtualization?.enabled || displayServices.length > COMPONENT_CONFIG.serviceList.virtualScrollThreshold;
  
  const virtualizer = useVirtualizer({
    count: displayServices.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => virtualization?.itemHeight || COMPONENT_CONFIG.serviceList.virtualScrolling.itemHeight,
    overscan: virtualization?.overscan || COMPONENT_CONFIG.serviceList.virtualScrolling.threshold,
  });

  // Selection configuration
  const selectionConfig: ServiceListRowSelection = selection || {
    mode: 'multiple',
    selectedIds: Array.from(selectedServices),
    onSelectionChange: (selectedIds: number[]) => {
      // Update selection in store
    },
    showSelectAll: true,
    selectAllState: isAllSelected ? 'all' : (isIndeterminate ? 'some' : 'none'),
    onSelectAll: toggleSelectAll,
    maxSelection: 100,
  };

  // Action handlers
  const handleEdit = useCallback((service: DatabaseService) => {
    // Navigate to edit page or open edit modal
    console.log('Edit service:', service);
  }, []);

  const handleDelete = useCallback((service: DatabaseService) => {
    setDeleteService(service);
  }, []);

  const handleDuplicate = useCallback(async (service: DatabaseService) => {
    try {
      await duplicateServiceMutation.mutateAsync(service.id);
    } catch (error) {
      console.error('Failed to duplicate service:', error);
    }
  }, [duplicateServiceMutation]);

  const handleTestConnection = useCallback(async (service: DatabaseService) => {
    try {
      await testConnectionMutation.mutateAsync({ id: service.id });
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }, [testConnectionMutation]);

  const handleBulkAction = useCallback(async (action: BulkAction) => {
    if (selectedServiceObjects.length === 0) return;

    if (action.requiresConfirmation) {
      setBulkActionDialog({ action, services: selectedServiceObjects });
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({
        action: action.id as any,
        serviceIds: Array.from(selectedServices),
        parameters: {},
        confirmed: true,
      });
      deselectAll();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedServiceObjects, selectedServices, bulkActionMutation, deselectAll]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteService) return;

    setIsDeleting(true);
    try {
      await deleteServiceMutation.mutateAsync({ id: deleteService.id });
      setDeleteService(null);
    } catch (error) {
      console.error('Failed to delete service:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteService, deleteServiceMutation]);

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkActionDialog) return;

    try {
      await bulkActionMutation.mutateAsync({
        action: bulkActionDialog.action.id as any,
        serviceIds: bulkActionDialog.services.map(s => s.id),
        parameters: {},
        confirmed: true,
      });
      setBulkActionDialog(null);
      deselectAll();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [bulkActionDialog, bulkActionMutation, deselectAll]);

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: ServiceListFilterData) => {
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  }, [setFilters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [clearFilters, onFilterChange]);

  // Sort handlers
  const handleSortChange = useCallback((newSort: ServiceListSortData) => {
    setSorting(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  }, [setSorting, onSortChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Add keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          selectAll(displayServices);
          break;
        case 'f':
          event.preventDefault();
          setShowFilters(!showFilters);
          break;
        case 'r':
          event.preventDefault();
          refresh();
          break;
      }
    }

    if (event.key === 'Escape') {
      deselectAll();
      setShowFilters(false);
    }
  }, [onKeyDown, selectAll, displayServices, showFilters, refresh, deselectAll]);

  // Auto-focus table on mount
  useEffect(() => {
    if (autoFocus && tableContainerRef.current) {
      tableContainerRef.current.focus();
    }
  }, [autoFocus]);

  // Loading state
  if (isDataLoading && displayServices.length === 0) {
    return LoadingOverlayComponent ? <LoadingOverlayComponent /> : <LoadingState />;
  }

  // Error state
  if (dataError && displayServices.length === 0) {
    return ErrorOverlayComponent ? 
      <ErrorOverlayComponent error={dataError.message} /> : 
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <p className="mt-4 text-sm text-red-600">{dataError.message}</p>
        <Button onClick={refresh} variant="outline" size="sm" className="mt-4">
          Try again
        </Button>
      </div>;
  }

  // Empty state
  if (displayServices.length === 0) {
    const hasActiveFilters = !!(storeFilters.search || storeFilters.type?.length || storeFilters.status?.length);
    
    return EmptyStateComponent ? 
      <EmptyStateComponent /> : 
      <EmptyState 
        message={emptyMessage}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />;
  }

  return (
    <div className={cn('flex flex-col space-y-4', className)} data-testid={dataTestId || testId} {...props}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Selected count */}
          {selectedCount > 0 && (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {selectedCount} selected
            </span>
          )}

          {/* Bulk actions */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  disabled={isBulkActionInProgress}
                  variant={action.variant}
                  size="sm"
                >
                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter toggle */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className={showFilters ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </Button>

          {/* Refresh */}
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={isDataLoading}
          >
            <ArrowPathIcon className={cn('h-4 w-4', isDataLoading && 'animate-spin')} />
            Refresh
          </Button>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              className={!enableVirtualization ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            >
              <TableCellsIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={enableVirtualization ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            >
              <Square3Stack3DIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <FilterControls
            filters={storeFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div 
              ref={tableContainerRef}
              className={cn(
                'overflow-hidden shadow ring-1 ring-black ring-opacity-5',
                bordered && 'border border-gray-200 dark:border-gray-700',
                'sm:rounded-lg'
              )}
              tabIndex={focusable ? 0 : undefined}
              onKeyDown={handleKeyDown}
              role="table"
              aria-label={ariaLabel}
              aria-description={ariaDescription}
            >
              {enableVirtualization ? (
                /* Virtual Table */
                <div
                  style={{
                    height: Math.min(600, virtualizer.getTotalSize()),
                    overflow: 'auto',
                  }}
                >
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <TableHeader
                      columns={columns}
                      sort={sort || { field: 'name', direction: 'asc' }}
                      onSortChange={handleSortChange}
                      selection={selectionConfig}
                    />
                  </table>
                  
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const service = displayServices[virtualItem.index];
                      if (!service) return null;

                      return (
                        <div
                          key={virtualItem.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: virtualItem.size,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <table className="min-w-full">
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              <TableRow
                                service={service}
                                columns={columns}
                                index={virtualItem.index}
                                selected={isSelected(service.id)}
                                onSelectionChange={(selected) => {
                                  toggleSelection(service.id);
                                }}
                                onRowClick={onRowClick}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onTestConnection={handleTestConnection}
                                className={cn(
                                  striped && virtualItem.index % 2 === 0 && 'bg-gray-50 dark:bg-gray-800',
                                  hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                )}
                              />
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Regular Table */
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <TableHeader
                    columns={columns}
                    sort={sort || { field: 'name', direction: 'asc' }}
                    onSortChange={handleSortChange}
                    selection={selectionConfig}
                  />
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {displayServices.map((service, index) => (
                      <TableRow
                        key={service.id}
                        service={service}
                        columns={columns}
                        index={index}
                        selected={isSelected(service.id)}
                        onSelectionChange={(selected) => {
                          toggleSelection(service.id);
                        }}
                        onRowClick={onRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onTestConnection={handleTestConnection}
                        className={cn(
                          striped && index % 2 === 0 && 'bg-gray-50 dark:bg-gray-800',
                          hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteService} onClose={() => setDeleteService(null)}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition
              show={!!deleteService}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      Delete Service
                    </DialogTitle>
                    <div className="mt-2">
                      <Description className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete "{deleteService?.name}"? This action cannot be undone.
                      </Description>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    variant="destructive"
                    className="w-full sm:ml-3 sm:w-auto"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    onClick={() => setDeleteService(null)}
                    variant="outline"
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogPanel>
            </Transition>
          </div>
        </div>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={!!bulkActionDialog} onClose={() => setBulkActionDialog(null)}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition
              show={!!bulkActionDialog}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className={cn(
                    "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
                    bulkActionDialog?.action.variant === 'destructive' 
                      ? 'bg-red-100 dark:bg-red-900'
                      : 'bg-yellow-100 dark:bg-yellow-900'
                  )}>
                    <ExclamationTriangleIcon className={cn(
                      "h-6 w-6",
                      bulkActionDialog?.action.variant === 'destructive'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    )} />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      {bulkActionDialog?.action.label}
                    </DialogTitle>
                    <div className="mt-2">
                      <Description className="text-sm text-gray-500 dark:text-gray-400">
                        {bulkActionDialog?.action.confirmationMessage || 
                         `Are you sure you want to ${bulkActionDialog?.action.label.toLowerCase()} ${bulkActionDialog?.services.length} service(s)?`}
                      </Description>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={handleConfirmBulkAction}
                    disabled={isBulkActionInProgress}
                    variant={bulkActionDialog?.action.variant || 'default'}
                    className="w-full sm:ml-3 sm:w-auto"
                  >
                    {isBulkActionInProgress ? 'Processing...' : 'Confirm'}
                  </Button>
                  <Button
                    onClick={() => setBulkActionDialog(null)}
                    variant="outline"
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogPanel>
            </Transition>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// Default export
export default ServiceListTable;

// Additional exports for external usage
export type {
  ServiceListTableProps,
  ServiceListColumn,
  ServiceListRowSelection,
  ServiceListAction,
  ServiceListFilterData,
  ServiceListSortData,
  ServiceListPaginationData,
};

export {
  DEFAULT_COLUMNS,
  BULK_ACTIONS,
  ServiceStatusBadge,
  ConnectionStatusIndicator,
  ServiceActionsMenu,
  TableHeader,
  TableRow,
  EmptyState,
  LoadingState,
  FilterControls,
};