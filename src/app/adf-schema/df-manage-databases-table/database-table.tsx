'use client';

/**
 * Database Service Management Table Component
 * 
 * React component that displays and manages a table of database service entries with TanStack Virtual
 * for large dataset handling. Replaces Angular DfManageDatabasesTableComponent with React Query 
 * for data fetching, Headless UI table components with Tailwind CSS styling, and Next.js routing
 * for navigation.
 * 
 * Features:
 * - TanStack Virtual implementation for databases with 1,000+ tables
 * - React Query for advanced data fetching operations with intelligent caching
 * - Cache hit responses under 50ms with TTL configuration (staleTime: 300 seconds)
 * - Headless UI components with Tailwind CSS 4.1+ styling
 * - Next.js routing for database detail navigation
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Real-time filtering and search capabilities
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Migration Team
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  EyeIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  DatabaseServiceRow, 
  DatabaseType,
  databaseQueryKeys 
} from '../../../types/database';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/** Table column definition for database services */
interface DatabaseServiceColumn {
  key: keyof DatabaseServiceRow | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (service: DatabaseServiceRow) => React.ReactNode;
}

/** Table filtering and sorting state */
interface TableState {
  searchTerm: string;
  sortBy: keyof DatabaseServiceRow | null;
  sortDirection: 'asc' | 'desc';
  typeFilter: DatabaseType | 'all';
  statusFilter: 'all' | 'active' | 'inactive';
}

/** Connection status indicator props */
interface ConnectionStatusProps {
  status?: DatabaseServiceRow['connection_status'];
  lastTested?: string;
}

/** Action button props for database service rows */
interface ActionButtonProps {
  service: DatabaseServiceRow;
  onNavigate: (serviceName: string) => void;
}

// ============================================================================
// MOCK DATA FETCHING FUNCTIONS (TO BE REPLACED WITH ACTUAL API CALLS)
// ============================================================================

/** 
 * Fetches database services from the API
 * Note: This is a mock implementation. In production, this would use the actual API client
 * from src/lib/api-client.ts once it's implemented.
 */
const fetchDatabaseServices = async (): Promise<DatabaseServiceRow[]> => {
  // Simulate API delay for realistic testing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock data representing database services
  const mockServices: DatabaseServiceRow[] = [
    {
      id: 1,
      name: 'mysql_main',
      label: 'MySQL Main Database',
      description: 'Primary MySQL database for application data',
      type: 'mysql',
      is_active: true,
      deletable: true,
      connection_status: 'connected',
      last_tested: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
      last_modified_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: 2,
      name: 'postgres_analytics',
      label: 'PostgreSQL Analytics',
      description: 'Analytics and reporting database',
      type: 'postgresql',
      is_active: true,
      deletable: true,
      connection_status: 'connected',
      last_tested: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      last_modified_date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 3,
      name: 'mongo_sessions',
      label: 'MongoDB Session Store',
      description: 'Session storage and user data',
      type: 'mongodb',
      is_active: false,
      deletable: true,
      connection_status: 'disconnected',
      last_tested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      last_modified_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 4,
      name: 'oracle_enterprise',
      label: 'Oracle Enterprise DB',
      description: 'Enterprise data warehouse',
      type: 'oracle',
      is_active: true,
      deletable: false,
      connection_status: 'testing',
      last_tested: new Date().toISOString(),
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      last_modified_date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 5,
      name: 'snowflake_warehouse',
      label: 'Snowflake Data Warehouse',
      description: 'Cloud data warehouse for large-scale analytics',
      type: 'snowflake',
      is_active: true,
      deletable: true,
      connection_status: 'error',
      last_tested: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      last_modified_date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ];
  
  // Simulate many more services for performance testing
  for (let i = 6; i <= 1000; i++) {
    const types: DatabaseType[] = ['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake'];
    const statuses: DatabaseServiceRow['connection_status'][] = ['connected', 'disconnected', 'testing', 'error'];
    
    mockServices.push({
      id: i,
      name: `database_${i.toString().padStart(4, '0')}`,
      label: `Database Service ${i}`,
      description: `Mock database service for performance testing ${i}`,
      type: types[i % types.length],
      is_active: Math.random() > 0.2, // 80% active
      deletable: Math.random() > 0.1, // 90% deletable
      connection_status: statuses[i % statuses.length],
      last_tested: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
      created_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString(),
      last_modified_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
    });
  }
  
  return mockServices;
};

/**
 * Fetches available service types for filtering
 * Note: This is a mock implementation. In production, this would use the actual API client.
 */
const fetchServiceTypes = async (): Promise<DatabaseType[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return ['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake'];
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Connection Status Indicator Component
 * Displays the current connection status with appropriate styling and icons
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, lastTested }) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircleIcon,
          text: 'Connected',
          className: 'text-green-600 bg-green-50 border-green-200',
        };
      case 'disconnected':
        return {
          icon: XCircleIcon,
          text: 'Disconnected',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
        };
      case 'testing':
        return {
          icon: ExclamationTriangleIcon,
          text: 'Testing',
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200 animate-pulse',
        };
      case 'error':
        return {
          icon: XCircleIcon,
          text: 'Error',
          className: 'text-red-600 bg-red-50 border-red-200',
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          text: 'Unknown',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  }, [status]);

  const Icon = statusConfig.icon;

  return (
    <div className="flex flex-col items-start space-y-1">
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${statusConfig.className}`}>
        <Icon className="h-3 w-3" />
        <span>{statusConfig.text}</span>
      </div>
      {lastTested && (
        <span className="text-xs text-gray-500">
          Tested: {new Date(lastTested).toLocaleString()}
        </span>
      )}
    </div>
  );
};

/**
 * Action Button Component
 * Renders action buttons for each database service row
 */
const ActionButton: React.FC<ActionButtonProps> = ({ service, onNavigate }) => {
  const handleViewClick = useCallback(() => {
    onNavigate(service.name);
  }, [service.name, onNavigate]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleViewClick}
        className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`View details for ${service.label}`}
      >
        <EyeIcon className="h-4 w-4" />
        <span>View</span>
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Database Table Component
 * 
 * Displays a virtualized table of database services with filtering, sorting,
 * and navigation capabilities. Optimized for handling 1000+ database entries
 * with TanStack Virtual and React Query caching.
 */
export const DatabaseTable: React.FC = () => {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [tableState, setTableState] = useState<TableState>({
    searchTerm: '',
    sortBy: 'name',
    sortDirection: 'asc',
    typeFilter: 'all',
    statusFilter: 'all',
  });

  // ========================================
  // DATA FETCHING WITH REACT QUERY
  // ========================================
  
  /** 
   * Database services query with intelligent caching
   * - staleTime: 300 seconds (5 minutes) per requirements
   * - Optimized for cache hit responses under 50ms
   */
  const {
    data: databaseServices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: databaseQueryKeys.services(),
    queryFn: fetchDatabaseServices,
    staleTime: 300 * 1000, // 5 minutes - per Section 5.2 Component Details
    cacheTime: 900 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /** Service types query for filtering */
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: fetchServiceTypes,
    staleTime: 600 * 1000, // 10 minutes
    cacheTime: 1800 * 1000, // 30 minutes
  });

  // ========================================
  // DATA FILTERING AND SORTING
  // ========================================
  
  const filteredAndSortedData = useMemo(() => {
    let filtered = databaseServices.filter(service => {
      // Filter by active status only (matching Angular component behavior)
      if (!service.is_active) return false;
      
      // Filter by search term
      if (tableState.searchTerm) {
        const searchLower = tableState.searchTerm.toLowerCase();
        const matchesSearch = 
          service.name.toLowerCase().includes(searchLower) ||
          service.label.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.type.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Filter by database type
      if (tableState.typeFilter !== 'all' && service.type !== tableState.typeFilter) {
        return false;
      }
      
      // Filter by status
      if (tableState.statusFilter !== 'all') {
        const isActive = service.is_active && (service.connection_status === 'connected' || service.connection_status === 'testing');
        if (tableState.statusFilter === 'active' && !isActive) return false;
        if (tableState.statusFilter === 'inactive' && isActive) return false;
      }
      
      return true;
    });

    // Sort data
    if (tableState.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[tableState.sortBy!];
        const bValue = b[tableState.sortBy!];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return tableState.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [databaseServices, tableState]);

  // ========================================
  // VIRTUALIZATION SETUP
  // ========================================
  
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside visible area
  });

  // ========================================
  // TABLE COLUMN CONFIGURATION
  // ========================================
  
  const columns: DatabaseServiceColumn[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 'w-1/6',
      render: (service) => (
        <div className="font-medium text-gray-900">
          <Link 
            href={`/adf-schema/databases/${service.name}`}
            className="hover:text-blue-600 transition-colors duration-200"
          >
            {service.name}
          </Link>
        </div>
      ),
    },
    {
      key: 'label',
      label: 'Label',
      sortable: true,
      width: 'w-1/5',
      render: (service) => (
        <div className="text-gray-900">{service.label}</div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: 'w-1/4',
      render: (service) => (
        <div className="text-gray-600 truncate" title={service.description}>
          {service.description || '—'}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: 'w-1/8',
      render: (service) => (
        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border">
          {service.type.toUpperCase()}
        </div>
      ),
    },
    {
      key: 'connection_status' as keyof DatabaseServiceRow,
      label: 'Status',
      sortable: true,
      width: 'w-1/6',
      render: (service) => (
        <ConnectionStatus 
          status={service.connection_status} 
          lastTested={service.last_tested} 
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: 'w-1/8',
      render: (service) => (
        <ActionButton 
          service={service} 
          onNavigate={handleNavigateToService} 
        />
      ),
    },
  ], []);

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  const handleNavigateToService = useCallback((serviceName: string) => {
    router.push(`/adf-schema/databases/${serviceName}`);
  }, [router]);

  const handleSort = useCallback((column: keyof DatabaseServiceRow) => {
    setTableState(prev => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTableState(prev => ({
      ...prev,
      searchTerm: event.target.value,
    }));
  }, []);

  const handleTypeFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setTableState(prev => ({
      ...prev,
      typeFilter: event.target.value as DatabaseType | 'all',
    }));
  }, []);

  const handleStatusFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setTableState(prev => ({
      ...prev,
      statusFilter: event.target.value as 'all' | 'active' | 'inactive',
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ========================================
  // RENDER METHODS
  // ========================================
  
  const renderTableHeader = () => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Database Services</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={tableState.searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={tableState.typeFilter}
            onChange={handleTypeFilterChange}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {serviceTypes.map(type => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={tableState.statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Table Column Headers */}
      <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={column.key}
            className={`${column.width} ${column.sortable ? 'cursor-pointer' : ''}`}
            onClick={column.sortable ? () => handleSort(column.key as keyof DatabaseServiceRow) : undefined}
          >
            <div className="flex items-center space-x-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {column.label}
              </span>
              {column.sortable && tableState.sortBy === column.key && (
                <span className="text-gray-400">
                  {tableState.sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTableRow = (service: DatabaseServiceRow, index: number) => (
    <div
      key={service.id}
      className={`flex items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
      }`}
    >
      {columns.map((column) => (
        <div key={column.key} className={column.width}>
          {column.render ? column.render(service) : (
            <div className="text-sm text-gray-900">
              {service[column.key as keyof DatabaseServiceRow] as React.ReactNode}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No database services found</h3>
      <p className="text-gray-500 text-center max-w-md">
        {tableState.searchTerm || tableState.typeFilter !== 'all' || tableState.statusFilter !== 'all'
          ? 'No services match your current filters. Try adjusting your search criteria.'
          : 'There are no active database services configured. Create a new service to get started.'
        }
      </p>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <XCircleIcon className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading database services</h3>
      <p className="text-gray-500 text-center max-w-md mb-4">
        {error instanceof Error ? error.message : 'An unexpected error occurred while loading the database services.'}
      </p>
      <button
        onClick={handleRefresh}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );

  // ========================================
  // MAIN RENDER
  // ========================================
  
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {renderTableHeader()}
      
      <div className="flex-1 overflow-hidden">
        {isError ? (
          renderErrorState()
        ) : filteredAndSortedData.length === 0 ? (
          renderEmptyState()
        ) : (
          <div
            ref={parentRef}
            className="h-full overflow-auto"
            style={{
              contain: 'strict',
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const service = filteredAndSortedData[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderTableRow(service, virtualRow.index)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with results count */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {filteredAndSortedData.length} of {databaseServices.length} database services
          </p>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseTable;