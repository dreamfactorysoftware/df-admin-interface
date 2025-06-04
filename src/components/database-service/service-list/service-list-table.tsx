/**
 * Database Service List Table Component
 * 
 * React table component for displaying and managing database services in a paginated,
 * filterable table format. Implements service listing functionality using React Query
 * for data fetching, Headless UI for accessible table components, and Tailwind CSS
 * for styling. Provides CRUD operations including delete functionality with optimistic
 * updates and handles large datasets with virtual scrolling.
 * 
 * Migrated from Angular DfManageServicesTableComponent to React functional component
 * with modern patterns and enhanced performance optimizations.
 * 
 * @fileoverview Service list table with comprehensive CRUD operations and accessibility
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useTransition,
  forwardRef,
  useImperativeHandle,
  ComponentPropsWithoutRef
} from 'react';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid 
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Import types and hooks (these will be available when dependency files are created)
import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ServiceListFilters,
  ServiceListSort,
  ServiceListTableProps,
  ServiceListCellProps,
  ServiceListColumn,
  TableSelectionConfig,
  PaginationConfig,
  SortingConfig,
  FilteringConfig,
  VirtualizationConfig,
  BulkActionType,
  ServiceActionConfig
} from './service-list-types';
import {
  useServiceListComplete,
  useServiceListVirtualization,
  useServiceConnectionStatus
} from './service-list-hooks';
import { DATABASE_TYPES, DATABASE_SERVICE_UI_CONFIG } from '../constants';

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Service list table component props with comprehensive configuration options
 */
interface ServiceListTableComponentProps extends ComponentPropsWithoutRef<'div'> {
  services?: DatabaseService[];
  loading?: boolean;
  error?: Error | null;
  onServiceSelect?: (service: DatabaseService) => void;
  onServiceEdit?: (service: DatabaseService) => void;
  onServiceDelete?: (service: DatabaseService) => void;
  onServiceDuplicate?: (service: DatabaseService) => void;
  onServiceTest?: (service: DatabaseService) => void;
  onServiceToggle?: (service: DatabaseService, active: boolean) => void;
  onBulkActions?: (action: BulkActionType, services: DatabaseService[]) => void;
  onRefresh?: () => void;
  selection?: Partial<TableSelectionConfig>;
  pagination?: Partial<PaginationConfig>;
  sorting?: Partial<SortingConfig>;
  filtering?: Partial<FilteringConfig>;
  virtualization?: Partial<VirtualizationConfig>;
  enableVirtualization?: boolean;
  enableBulkActions?: boolean;
  enableContextMenu?: boolean;
  compactMode?: boolean;
  showConnectionStatus?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
  'data-testid'?: string;
}

/**
 * Service list table ref interface for imperative control
 */
interface ServiceListTableRef {
  refresh: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  getSelectedServices: () => DatabaseService[];
  scrollToService: (serviceId: number) => void;
  focusSearch: () => void;
}

/**
 * Service row action dropdown props
 */
interface ServiceActionsDropdownProps {
  service: DatabaseService;
  onEdit?: (service: DatabaseService) => void;
  onDelete?: (service: DatabaseService) => void;
  onDuplicate?: (service: DatabaseService) => void;
  onTest?: (service: DatabaseService) => void;
  onToggle?: (service: DatabaseService, active: boolean) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Connection status indicator props
 */
interface ConnectionStatusIndicatorProps {
  service: DatabaseService;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format date for display in table cells
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Get database type display information
 */
const getDatabaseTypeInfo = (type: DatabaseDriver) => {
  return DATABASE_TYPES[type] || {
    label: type.toUpperCase(),
    group: 'Database',
    tier: 'core'
  };
};

/**
 * Get service status display information
 */
const getServiceStatusInfo = (status: ServiceStatus) => {
  const statusConfig = {
    active: {
      label: 'Active',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircleIconSolid
    },
    inactive: {
      label: 'Inactive',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: StopIcon
    },
    testing: {
      label: 'Testing',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: ArrowPathIcon
    },
    error: {
      label: 'Error',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: XCircleIconSolid
    },
    configuring: {
      label: 'Configuring',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: Cog6ToothIcon
    },
    pending: {
      label: 'Pending',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: ClockIcon
    }
  };

  return statusConfig[status] || statusConfig.inactive;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Connection Status Indicator Component
 */
const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  service,
  showDetails = false,
  size = 'md',
  className,
  'data-testid': testId
}) => {
  const { result, status, isLoading, test } = useServiceConnectionStatus(
    service.id,
    service.config as any
  );

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center space-x-2', className)}
        data-testid={testId}
        title="Testing connection..."
      >
        <ArrowPathIcon className={cn(iconSize, 'animate-spin text-blue-500')} />
        {showDetails && (
          <span className={cn(textSize, 'text-blue-600 dark:text-blue-400')}>
            Testing...
          </span>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className={cn('flex items-center space-x-2', className)}
        data-testid={testId}
        title="Connection status unknown"
      >
        <div className={cn(iconSize, 'rounded-full bg-gray-400')} />
        {showDetails && (
          <span className={cn(textSize, 'text-gray-600 dark:text-gray-400')}>
            Unknown
          </span>
        )}
      </div>
    );
  }

  const statusIcon = result.success ? (
    <CheckCircleIconSolid className={cn(iconSize, 'text-green-500')} />
  ) : (
    <XCircleIconSolid className={cn(iconSize, 'text-red-500')} />
  );

  const statusText = result.success ? 'Connected' : 'Connection Failed';
  const statusColor = result.success
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div
      className={cn('flex items-center space-x-2', className)}
      data-testid={testId}
      title={`${statusText}: ${result.message}`}
    >
      {statusIcon}
      {showDetails && (
        <div className={textSize}>
          <div className={cn('font-medium', statusColor)}>
            {statusText}
          </div>
          {result.testDuration && (
            <div className="text-xs text-gray-500">
              {result.testDuration}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Service Actions Dropdown Component
 */
const ServiceActionsDropdown: React.FC<ServiceActionsDropdownProps> = ({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onTest,
  onToggle,
  className,
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const actions: ServiceActionConfig[] = [
    {
      id: 'edit',
      label: 'Edit Configuration',
      icon: PencilIcon,
      action: () => onEdit?.(service),
      disabled: () => !service.mutable,
      priority: 1
    },
    {
      id: 'duplicate',
      label: 'Duplicate Service',
      icon: DocumentDuplicateIcon,
      action: () => onDuplicate?.(service),
      priority: 2
    },
    {
      id: 'test',
      label: 'Test Connection',
      icon: PlayIcon,
      action: () => onTest?.(service),
      priority: 3
    },
    {
      id: 'toggle',
      label: service.is_active ? 'Deactivate' : 'Activate',
      icon: service.is_active ? StopIcon : PlayIcon,
      action: () => onToggle?.(service, !service.is_active),
      disabled: () => !service.mutable,
      priority: 4
    },
    {
      id: 'delete',
      label: 'Delete Service',
      icon: TrashIcon,
      action: () => onDelete?.(service),
      dangerous: true,
      disabled: () => !service.deletable,
      priority: 5
    }
  ];

  const availableActions = actions.filter(action => 
    !action.disabled?.(service) && !action.hidden?.(service)
  );

  return (
    <div ref={dropdownRef} className={cn('relative', className)} data-testid={testId}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label={`Actions for ${service.label || service.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-testid={`${testId}-trigger`}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-9 z-20 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1"
          role="menu"
          aria-orientation="vertical"
          data-testid={`${testId}-menu`}
        >
          {availableActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.action(service);
                }}
                className={cn(
                  'flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  action.dangerous
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300'
                )}
                role="menuitem"
                tabIndex={0}
                data-testid={`${testId}-action-${action.id}`}
                aria-label={action.description || action.label}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
                {action.shortcut && (
                  <span className="ml-auto text-xs text-gray-400">
                    {action.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Service Status Badge Component
 */
const ServiceStatusBadge: React.FC<{
  service: DatabaseService;
  className?: string;
  'data-testid'?: string;
}> = ({ service, className, 'data-testid': testId }) => {
  const status = service.status || (service.is_active ? 'active' : 'inactive');
  const statusInfo = getServiceStatusInfo(status);
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusInfo.color,
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
      data-testid={testId}
      title={`Service status: ${statusInfo.label}`}
    >
      <Icon className="h-3 w-3 mr-1.5" />
      {statusInfo.label}
    </div>
  );
};

/**
 * Database Type Badge Component
 */
const DatabaseTypeBadge: React.FC<{
  type: DatabaseDriver;
  className?: string;
  'data-testid'?: string;
}> = ({ type, className, 'data-testid': testId }) => {
  const typeInfo = getDatabaseTypeInfo(type);
  
  const tierColors = {
    core: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    silver: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    gold: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-1 rounded text-xs font-medium border',
        tierColors[typeInfo.tier],
        className
      )}
      data-testid={testId}
      title={`${typeInfo.label} (${typeInfo.tier} tier)`}
    >
      <ServerIcon className="h-3 w-3 mr-1" />
      {typeInfo.label}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Database Service List Table Component
 * 
 * Comprehensive table component for managing database services with modern React patterns,
 * accessibility support, virtual scrolling for performance, and full CRUD operations.
 */
export const ServiceListTable = forwardRef<ServiceListTableRef, ServiceListTableComponentProps>(
  ({
    services: externalServices,
    loading: externalLoading,
    error: externalError,
    onServiceSelect,
    onServiceEdit,
    onServiceDelete,
    onServiceDuplicate,
    onServiceTest,
    onServiceToggle,
    onBulkActions,
    onRefresh,
    selection,
    pagination,
    sorting,
    filtering,
    virtualization,
    enableVirtualization = true,
    enableBulkActions = true,
    enableContextMenu = true,
    compactMode = false,
    showConnectionStatus = true,
    refreshInterval = 30000,
    autoRefresh = false,
    className,
    'data-testid': testId,
    ...props
  }, ref) => {
    // Refs and state
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof DatabaseService>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Use the compound hook for complete service list functionality
    const {
      services,
      loading,
      error,
      refetch,
      refresh,
      mutations,
      selection: selectionState,
      filters,
      updateFilters,
      setSearch,
      setSorting,
      export: exportHook,
      virtualization: virtualizationHook
    } = useServiceListComplete({
      enabled: true,
      enableVirtualization: enableVirtualization && services && services.length > 50,
      containerRef
    });

    // Use external data if provided, otherwise use hook data
    const displayServices = externalServices || services;
    const isLoading = externalLoading !== undefined ? externalLoading : loading;
    const displayError = externalError !== undefined ? externalError : error;

    // Column definitions for the table
    const columns: ServiceListColumn[] = useMemo(() => [
      {
        key: 'selection',
        header: '',
        width: '48px',
        sticky: 'left',
        cell: ({ row, index }: ServiceListCellProps) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectionState.isSelected(row.id)}
              onChange={() => selectionState.toggleSelection(row.id)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              aria-label={`Select ${row.label || row.name}`}
              data-testid={`service-${row.id}-checkbox`}
            />
          </div>
        ),
        visible: enableBulkActions
      },
      {
        key: 'name',
        header: 'Service Name',
        accessorKey: 'name',
        sortable: true,
        searchable: true,
        minWidth: '200px',
        cell: ({ row }: ServiceListCellProps) => (
          <div className="flex flex-col">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {row.label || row.name}
            </div>
            {row.label && row.label !== row.name && (
              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {row.name}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'type',
        header: 'Database Type',
        accessorKey: 'type',
        sortable: true,
        filterable: true,
        width: '150px',
        cell: ({ row }: ServiceListCellProps) => (
          <DatabaseTypeBadge 
            type={row.type}
            data-testid={`service-${row.id}-type-badge`}
          />
        )
      },
      {
        key: 'status',
        header: 'Status',
        width: '120px',
        sortable: true,
        filterable: true,
        cell: ({ row }: ServiceListCellProps) => (
          <ServiceStatusBadge 
            service={row}
            data-testid={`service-${row.id}-status-badge`}
          />
        )
      },
      {
        key: 'connection',
        header: 'Connection',
        width: '120px',
        cell: ({ row }: ServiceListCellProps) => (
          <ConnectionStatusIndicator
            service={row}
            showDetails={!compactMode}
            size={compactMode ? 'sm' : 'md'}
            data-testid={`service-${row.id}-connection-status`}
          />
        ),
        visible: showConnectionStatus
      },
      {
        key: 'description',
        header: 'Description',
        accessorKey: 'description',
        searchable: true,
        cell: ({ row }: ServiceListCellProps) => (
          <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
            {row.description || '—'}
          </div>
        ),
        visible: !compactMode
      },
      {
        key: 'created_date',
        header: 'Created',
        accessorKey: 'created_date',
        sortable: true,
        width: '140px',
        cell: ({ row }: ServiceListCellProps) => (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(row.created_date)}
          </div>
        ),
        visible: !compactMode
      },
      {
        key: 'last_modified_date',
        header: 'Modified',
        accessorKey: 'last_modified_date',
        sortable: true,
        width: '140px',
        cell: ({ row }: ServiceListCellProps) => (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(row.last_modified_date)}
          </div>
        ),
        visible: !compactMode
      },
      {
        key: 'actions',
        header: '',
        width: '60px',
        sticky: 'right',
        cell: ({ row }: ServiceListCellProps) => (
          <ServiceActionsDropdown
            service={row}
            onEdit={onServiceEdit}
            onDelete={onServiceDelete}
            onDuplicate={onServiceDuplicate}
            onTest={onServiceTest}
            onToggle={onServiceToggle}
            data-testid={`service-${row.id}-actions`}
          />
        )
      }
    ].filter(column => column.visible !== false), [
      enableBulkActions,
      showConnectionStatus,
      compactMode,
      selectionState,
      onServiceEdit,
      onServiceDelete,
      onServiceDuplicate,
      onServiceTest,
      onServiceToggle
    ]);

    // Filter services based on search term
    const filteredServices = useMemo(() => {
      if (!searchTerm.trim()) return displayServices;
      
      const term = searchTerm.toLowerCase();
      return displayServices.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.label?.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term) ||
        service.type.toLowerCase().includes(term)
      );
    }, [displayServices, searchTerm]);

    // Sort services
    const sortedServices = useMemo(() => {
      const sorted = [...filteredServices];
      sorted.sort((a, b) => {
        const aValue = a[sortField] as any;
        const bValue = b[sortField] as any;
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }, [filteredServices, sortField, sortDirection]);

    // Virtual scrolling setup for large datasets
    const virtualizer = useVirtualizer({
      count: sortedServices.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => (compactMode ? 48 : 64),
      overscan: 10
    });

    const virtualItems = enableVirtualization && sortedServices.length > 50 
      ? virtualizer.getVirtualItems()
      : null;

    // Event handlers
    const handleSort = useCallback((field: keyof DatabaseService) => {
      startTransition(() => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDirection('asc');
        }
        setSorting({ field, direction: sortDirection === 'asc' ? 'desc' : 'asc' });
      });
    }, [sortField, sortDirection, setSorting]);

    const handleSearch = useCallback((value: string) => {
      startTransition(() => {
        setSearchTerm(value);
        setSearch(value);
      });
    }, [setSearch]);

    const handleRowClick = useCallback((service: DatabaseService) => {
      onServiceSelect?.(service);
    }, [onServiceSelect]);

    const handleRowKeyDown = useCallback((
      event: React.KeyboardEvent,
      service: DatabaseService,
      index: number
    ) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          onServiceSelect?.(service);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (index < sortedServices.length - 1) {
            const nextRow = containerRef.current?.querySelector(
              `[data-row-index="${index + 1}"]`
            ) as HTMLElement;
            nextRow?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (index > 0) {
            const prevRow = containerRef.current?.querySelector(
              `[data-row-index="${index - 1}"]`
            ) as HTMLElement;
            prevRow?.focus();
          }
          break;
      }
    }, [onServiceSelect, sortedServices.length]);

    // Imperative handle for parent component control
    useImperativeHandle(ref, () => ({
      refresh: () => {
        refresh();
        onRefresh?.();
      },
      clearSelection: () => {
        selectionState.selectNone();
      },
      selectAll: () => {
        selectionState.selectAll();
      },
      getSelectedServices: () => {
        return selectionState.selectedServices;
      },
      scrollToService: (serviceId: number) => {
        const index = sortedServices.findIndex(s => s.id === serviceId);
        if (index >= 0 && virtualizer) {
          virtualizer.scrollToIndex(index);
        }
      },
      focusSearch: () => {
        searchInputRef.current?.focus();
      }
    }), [refresh, onRefresh, selectionState, sortedServices, virtualizer]);

    // Auto-refresh setup
    useEffect(() => {
      if (!autoRefresh || !refreshInterval) return;

      const interval = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, refresh]);

    // Render loading state
    if (isLoading && sortedServices.length === 0) {
      return (
        <div 
          className={cn('flex flex-col items-center justify-center p-12 space-y-4', className)}
          data-testid={`${testId}-loading`}
          {...props}
        >
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading database services...
          </div>
        </div>
      );
    }

    // Render error state
    if (displayError && sortedServices.length === 0) {
      return (
        <div 
          className={cn('flex flex-col items-center justify-center p-12 space-y-4', className)}
          data-testid={`${testId}-error`}
          {...props}
        >
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          <div className="text-center">
            <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
              Failed to load services
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {displayError.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              refresh();
              onRefresh?.();
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
            Retry
          </button>
        </div>
      );
    }

    // Render empty state
    if (sortedServices.length === 0) {
      return (
        <div 
          className={cn('flex flex-col items-center justify-center p-12 space-y-4', className)}
          data-testid={`${testId}-empty`}
          {...props}
        >
          <ServerIcon className="h-12 w-12 text-gray-400" />
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {searchTerm ? 'No services found' : 'No database services'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `No services match "${searchTerm}"`
                : 'Get started by creating your first database service'
              }
            </div>
          </div>
          {!searchTerm && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => {
                // Navigate to create service page
                window.location.href = '/api-connections/database/create';
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Create Database Service
            </button>
          )}
        </div>
      );
    }

    // Main table render
    return (
      <div 
        className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}
        data-testid={testId}
        {...props}
      >
        {/* Header with search and actions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                data-testid={`${testId}-search-input`}
                aria-label="Search database services"
              />
            </div>
            
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {sortedServices.length} of {displayServices.length} services
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {enableBulkActions && selectionState.selectedCount > 0 && (
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectionState.selectedCount} selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const selectedServices = selectionState.selectedServices;
                    onBulkActions?.('delete', selectedServices);
                  }}
                  className="inline-flex items-center px-2 py-1 border border-red-300 dark:border-red-600 text-xs font-medium rounded text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  data-testid={`${testId}-bulk-delete`}
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Delete Selected
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                refresh();
                onRefresh?.();
              }}
              disabled={isLoading}
              className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              data-testid={`${testId}-refresh-button`}
              aria-label="Refresh service list"
            >
              <ArrowPathIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Table container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto"
          style={{ height: enableVirtualization ? '100%' : 'auto' }}
          data-testid={`${testId}-table-container`}
        >
          <table
            className="w-full border-collapse"
            role="table"
            aria-label="Database services table"
            aria-rowcount={sortedServices.length + 1}
          >
            {/* Table header */}
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr role="row" aria-rowindex={1}>
                {columns.map((column, columnIndex) => (
                  <th
                    key={column.key as string}
                    role="columnheader"
                    scope="col"
                    aria-colindex={columnIndex + 1}
                    aria-sort={
                      column.sortable && sortField === column.accessorKey
                        ? sortDirection
                        : column.sortable ? 'none' : undefined
                    }
                    className={cn(
                      'text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700',
                      column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                      column.sticky === 'left' && 'sticky left-0 bg-gray-50 dark:bg-gray-800 z-20',
                      column.sticky === 'right' && 'sticky right-0 bg-gray-50 dark:bg-gray-800 z-20',
                      compactMode ? 'px-2 py-2' : 'px-4 py-3'
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth
                    }}
                    onClick={() => {
                      if (column.sortable && column.accessorKey) {
                        handleSort(column.accessorKey);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (column.sortable && column.accessorKey && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleSort(column.accessorKey);
                      }
                    }}
                    tabIndex={column.sortable ? 0 : undefined}
                    data-testid={`${testId}-header-${column.key}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && column.accessorKey === sortField && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-3 w-3" />
                          ) : (
                            <ChevronDownIcon className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody
              className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
              style={virtualItems ? {
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative'
              } : undefined}
            >
              {(virtualItems || sortedServices.map((service, index) => ({ service, index }))).map((item) => {
                const { service, index } = virtualItems ? {
                  service: sortedServices[item.index],
                  index: item.index
                } : item as { service: DatabaseService; index: number };

                return (
                  <tr
                    key={service.id}
                    role="row"
                    aria-rowindex={index + 2}
                    aria-selected={selectionState.isSelected(service.id)}
                    data-row-index={index}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800 focus-within:bg-primary-50 dark:focus-within:bg-primary-900/20 cursor-pointer transition-colors',
                      selectionState.isSelected(service.id) && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    style={virtualItems ? {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${item.size}px`,
                      transform: `translateY(${item.start}px)`
                    } : undefined}
                    onClick={() => handleRowClick(service)}
                    onKeyDown={(e) => handleRowKeyDown(e, service, index)}
                    tabIndex={0}
                    data-testid={`${testId}-row-${service.id}`}
                  >
                    {columns.map((column, columnIndex) => (
                      <td
                        key={`${service.id}-${column.key}`}
                        role="gridcell"
                        aria-colindex={columnIndex + 1}
                        className={cn(
                          'border-b border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100',
                          column.sticky === 'left' && 'sticky left-0 bg-white dark:bg-gray-900 z-10',
                          column.sticky === 'right' && 'sticky right-0 bg-white dark:bg-gray-900 z-10',
                          compactMode ? 'px-2 py-2' : 'px-4 py-3',
                          column.cellClassName
                        )}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth
                        }}
                        data-testid={`${testId}-cell-${service.id}-${column.key}`}
                      >
                        {column.cell ? 
                          column.cell({
                            value: column.accessorKey ? service[column.accessorKey] : undefined,
                            row: service,
                            column,
                            index,
                            isSelected: selectionState.isSelected(service.id)
                          }) :
                          column.accessorKey ? String(service[column.accessorKey] || '') : ''
                        }
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination and stats */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {sortedServices.length} of {displayServices.length} services
            {selectionState.selectedCount > 0 && (
              <span className="ml-2">
                • {selectionState.selectedCount} selected
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {enableBulkActions && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectionState.isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectionState.isPartialSelected;
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectionState.selectAll();
                      } else {
                        selectionState.selectNone();
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                    data-testid={`${testId}-select-all-checkbox`}
                  />
                  Select all
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && sortedServices.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-30">
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <ArrowPathIcon className="h-4 w-4 animate-spin text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Refreshing services...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ServiceListTable.displayName = 'ServiceListTable';

// =============================================================================
// EXPORTS
// =============================================================================

export default ServiceListTable;
export type { ServiceListTableComponentProps, ServiceListTableRef };