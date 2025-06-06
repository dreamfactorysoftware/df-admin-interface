/**
 * @fileoverview API Documentation List Component
 * @description React component for displaying a searchable, filterable table of available API documentation services
 * Implements TanStack Table for virtualized rendering of large datasets with pagination, sorting, and navigation
 * Replaces Angular df-api-docs-table.component.ts with modern React table patterns
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - TanStack Table and Virtual for large dataset performance per React/Next.js Integration Requirements
 * - React Query for server state management with intelligent caching per technical implementation requirements
 * - Headless UI integration with Tailwind CSS styling per Section 7.1 Core UI Technologies
 * - F-006: API Documentation and Testing service listing and navigation per Section 2.1 Feature Catalog
 * - Real-time search and filtering capabilities with optimized performance using React hooks
 * - Next.js useRouter for API documentation access per React/Next.js Integration Requirements
 * - Virtual scrolling for efficient rendering of large service lists (1000+ items) per F-002-RQ-002 performance requirements
 */

'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { Badge } from '@headlessui/react'

// Type imports - these would normally come from the dependency files
import type { 
  ApiDocsRowData, 
  ApiDocsListProps, 
  ApiDocsListConfig,
  ServiceStatus,
  ServiceCategory 
} from './types'

// Mock hook implementations for compilation - these would normally come from dependency files
const useServices = () => {
  return useQuery({
    queryKey: ['services', 'documentation'],
    queryFn: async (): Promise<ApiDocsRowData[]> => {
      // This would normally fetch from the API
      const response = await fetch('/api/v2/system/service?group=database&include_docs=true')
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

// Status and health indicator components
const StatusBadge: React.FC<{ status?: ServiceStatus }> = ({ status }) => {
  const getStatusConfig = (status?: ServiceStatus) => {
    switch (status) {
      case 'active':
        return { color: 'green', icon: CheckCircleIcon, label: 'Active' }
      case 'inactive':
        return { color: 'gray', icon: XCircleIcon, label: 'Inactive' }
      case 'error':
        return { color: 'red', icon: ExclamationTriangleIcon, label: 'Error' }
      case 'testing':
        return { color: 'yellow', icon: ClockIcon, label: 'Testing' }
      case 'deploying':
        return { color: 'blue', icon: CpuChipIcon, label: 'Deploying' }
      case 'updating':
        return { color: 'purple', icon: ArrowsUpDownIcon, label: 'Updating' }
      default:
        return { color: 'gray', icon: XCircleIcon, label: 'Unknown' }
    }
  }

  const { color, icon: Icon, label } = getStatusConfig(status)
  
  return (
    <Badge 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
        ${color === 'gray' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' : ''}
        ${color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
        ${color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
        ${color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
        ${color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
      `}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const HealthIndicator: React.FC<{ health?: ApiDocsRowData['health'] }> = ({ health }) => {
  if (!health) return null

  const getHealthConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'green', icon: CheckCircleIcon, label: 'Healthy' }
      case 'degraded':
        return { color: 'yellow', icon: ExclamationTriangleIcon, label: 'Degraded' }
      case 'unhealthy':
        return { color: 'red', icon: XCircleIcon, label: 'Unhealthy' }
      default:
        return { color: 'gray', icon: ClockIcon, label: 'Unknown' }
    }
  }

  const { color, icon: Icon, label } = getHealthConfig(health.status)
  
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-medium
      ${color === 'green' ? 'text-green-600 dark:text-green-400' : ''}
      ${color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : ''}
      ${color === 'red' ? 'text-red-600 dark:text-red-400' : ''}
      ${color === 'gray' ? 'text-gray-500 dark:text-gray-400' : ''}
    `}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      {health.responseTime && (
        <span className="text-gray-500">({health.responseTime}ms)</span>
      )}
    </div>
  )
}

// Category badge component
const CategoryBadge: React.FC<{ category: ServiceCategory }> = ({ category }) => {
  const getCategoryConfig = (category: ServiceCategory) => {
    const configs = {
      database: { color: 'blue', label: 'Database' },
      email: { color: 'purple', label: 'Email' },
      file: { color: 'green', label: 'File' },
      oauth: { color: 'red', label: 'OAuth' },
      ldap: { color: 'yellow', label: 'LDAP' },
      saml: { color: 'indigo', label: 'SAML' },
      script: { color: 'gray', label: 'Script' },
      cache: { color: 'orange', label: 'Cache' },
      push: { color: 'pink', label: 'Push' },
      remote_web: { color: 'cyan', label: 'Remote Web' },
      soap: { color: 'violet', label: 'SOAP' },
      rpc: { color: 'lime', label: 'RPC' },
      http: { color: 'teal', label: 'HTTP' },
      api_key: { color: 'amber', label: 'API Key' },
      jwt: { color: 'emerald', label: 'JWT' },
      custom: { color: 'stone', label: 'Custom' }
    }
    
    return configs[category] || { color: 'gray', label: 'Unknown' }
  }

  const { color, label } = getCategoryConfig(category)
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
      bg-${color}-100 text-${color}-800 dark:bg-${color}-900/30 dark:text-${color}-400
    `}>
      {label}
    </span>
  )
}

// Search input component
const SearchInput: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}> = ({ value, onChange, placeholder = 'Search services...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
      />
    </div>
  )
}

// Filter dropdown component  
const FilterDropdown: React.FC<{
  title: string
  options: Array<{ label: string; value: string }>
  selectedValues: string[]
  onChange: (values: string[]) => void
}> = ({ title, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
      >
        <FunnelIcon className="h-4 w-4" />
        {title}
        {selectedValues.length > 0 && (
          <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
            {selectedValues.length}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600">
          <div className="p-2 space-y-1">
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Action button component
const ActionButton: React.FC<{
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
}> = ({ 
  onClick, 
  icon: Icon, 
  label, 
  variant = 'ghost', 
  size = 'sm', 
  disabled = false 
}) => {
  const baseClasses = "inline-flex items-center gap-1 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
    ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
  }
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm"
  }
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

// Main API Docs List Component
export const ApiDocsList: React.FC<ApiDocsListProps> = ({
  data: externalData,
  loading: externalLoading,
  error: externalError,
  config = {},
  searchQuery: externalSearchQuery,
  filters: externalFilters,
  sorting: externalSorting,
  pagination: externalPagination,
  selection,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  onSearchChange,
  onFiltersChange,
  onSortingChange,
  onPaginationChange,
  onRefresh,
  renderToolbar,
  renderEmptyState,
  renderLoadingState,
  renderErrorState,
  size = 'md',
  testId = 'api-docs-list',
  className = '',
  ...props
}) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Fetch services data using React Query
  const { 
    data: fetchedData, 
    isLoading: isFetching, 
    error: fetchError,
    refetch 
  } = useServices()

  // Use external data if provided, otherwise use fetched data
  const data = externalData || fetchedData || []
  const loading = externalLoading ?? isFetching
  const error = externalError || fetchError

  // Local state for table controls
  const [globalFilter, setGlobalFilter] = useState(externalSearchQuery || '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>(externalSorting || [])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>(
    externalPagination || { pageIndex: 0, pageSize: config.table?.pageSize || 50 }
  )
  const [rowSelection, setRowSelection] = useState({})

  // Table container ref for virtualization
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Column helper for type safety
  const columnHelper = createColumnHelper<ApiDocsRowData>()

  // Define table columns
  const columns = useMemo<ColumnDef<ApiDocsRowData>[]>(() => [
    // Selection column
    ...(selection?.enabled ? [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        ),
        size: 40
      })
    ] : []),

    // Service name column
    columnHelper.accessor('name', {
      header: 'Service Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {row.original.label || row.original.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {row.original.name}
            </div>
          </div>
        </div>
      ),
      size: 200
    }),

    // Description column
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={getValue()}>
          {getValue() || 'No description available'}
        </div>
      ),
      size: 300
    }),

    // Category column
    columnHelper.accessor('group', {
      header: 'Category',
      cell: ({ getValue }) => <CategoryBadge category={getValue()} />,
      size: 120
    }),

    // Status column
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      size: 100
    }),

    // Health column
    columnHelper.display({
      id: 'health',
      header: 'Health',
      cell: ({ row }) => <HealthIndicator health={row.original.health} />,
      size: 120
    }),

    // Documentation status column
    columnHelper.display({
      id: 'documentation',
      header: 'Documentation',
      cell: ({ row }) => {
        const doc = row.original.documentation
        if (!doc) return <span className="text-gray-400 text-sm">No data</span>
        
        return (
          <div className="flex items-center gap-2">
            {doc.hasDocumentation ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Available
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                Not Generated
              </Badge>
            )}
            {doc.generationStatus && (
              <span className="text-xs text-gray-500">
                ({doc.generationStatus})
              </span>
            )}
          </div>
        )
      },
      size: 150
    }),

    // OpenAPI info column
    columnHelper.display({
      id: 'openapi',
      header: 'OpenAPI',
      cell: ({ row }) => {
        const openapi = row.original.openapi
        if (!openapi) return <span className="text-gray-400 text-sm">No spec</span>
        
        return (
          <div className="text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              v{openapi.version || 'unknown'}
            </div>
            {openapi.operationCount && (
              <div className="text-gray-500 text-xs">
                {openapi.operationCount} operations
              </div>
            )}
          </div>
        )
      },
      size: 100
    }),

    // Usage statistics column
    columnHelper.display({
      id: 'usage',
      header: 'Usage',
      cell: ({ row }) => {
        const usage = row.original.usage
        if (!usage) return <span className="text-gray-400 text-sm">No data</span>
        
        return (
          <div className="text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              {usage.dailyCalls || 0} calls today
            </div>
            <div className="text-gray-500 text-xs">
              {usage.totalCalls || 0} total
            </div>
          </div>
        )
      },
      size: 120
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ActionButton
            onClick={() => handleViewDocumentation(row.original)}
            icon={EyeIcon}
            label="View Documentation"
            variant="ghost"
          />
          <ActionButton
            onClick={() => handleTestAPI(row.original)}
            icon={PlayIcon}
            label="Test API"
            variant="ghost"
          />
          <ActionButton
            onClick={() => handleOpenInNewTab(row.original)}
            icon={ArrowTopRightOnSquareIcon}
            label="Open in New Tab"
            variant="ghost"
          />
        </div>
      ),
      size: 120
    })
  ], [selection?.enabled, columnHelper])

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter
    },
    enableRowSelection: selection?.enabled ?? false,
    enableMultiRowSelection: selection?.enableMulti ?? true,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      onSortingChange?.(newSorting)
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(newPagination)
      onPaginationChange?.(newPagination)
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value)
      onSearchChange?.(value)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false
  })

  // Virtualization setup for large datasets
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10,
    enabled: config.table?.virtualScrolling !== false && rows.length > 100
  })

  // Action handlers
  const handleViewDocumentation = useCallback((service: ApiDocsRowData) => {
    onRowClick?.(service)
    router.push(`/api-docs/${service.id}`)
  }, [onRowClick, router])

  const handleTestAPI = useCallback((service: ApiDocsRowData) => {
    router.push(`/api-docs/${service.id}/test`)
  }, [router])

  const handleOpenInNewTab = useCallback((service: ApiDocsRowData) => {
    window.open(`/api-docs/${service.id}`, '_blank')
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
    onRefresh?.()
  }, [refetch, onRefresh])

  // Filter options for dropdowns
  const categoryOptions = useMemo(() => [
    { label: 'Database', value: 'database' },
    { label: 'Email', value: 'email' },
    { label: 'File', value: 'file' },
    { label: 'OAuth', value: 'oauth' },
    { label: 'LDAP', value: 'ldap' },
    { label: 'SAML', value: 'saml' },
    { label: 'Script', value: 'script' },
    { label: 'Cache', value: 'cache' },
    { label: 'Push', value: 'push' },
    { label: 'Remote Web', value: 'remote_web' },
    { label: 'SOAP', value: 'soap' },
    { label: 'RPC', value: 'rpc' },
    { label: 'HTTP', value: 'http' },
    { label: 'API Key', value: 'api_key' },
    { label: 'JWT', value: 'jwt' },
    { label: 'Custom', value: 'custom' }
  ], [])

  const statusOptions = useMemo(() => [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Error', value: 'error' },
    { label: 'Testing', value: 'testing' },
    { label: 'Deploying', value: 'deploying' },
    { label: 'Updating', value: 'updating' }
  ], [])

  // Handle selection changes
  useEffect(() => {
    if (selection?.enabled && onSelectionChange) {
      const selectedIds = new Set(
        Object.keys(rowSelection)
          .filter(key => rowSelection[key])
          .map(key => parseInt(key))
      )
      onSelectionChange(selectedIds)
    }
  }, [rowSelection, selection?.enabled, onSelectionChange])

  // Loading state
  if (loading && renderLoadingState) {
    return <div className={className} {...props}>{renderLoadingState()}</div>
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`} {...props}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading API documentation...</span>
      </div>
    )
  }

  // Error state
  if (error && renderErrorState) {
    return <div className={className} {...props}>{renderErrorState(error as Error)}</div>
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`} {...props}>
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load API documentation
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {(error as Error)?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (!data.length) {
    if (renderEmptyState) {
      return <div className={className} {...props}>{renderEmptyState()}</div>
    }

    return (
      <div className={`p-8 text-center ${className}`} {...props}>
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No API documentation available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create database services to generate API documentation.
        </p>
        <button
          onClick={() => router.push('/api-connections/database/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
        >
          Create Database Service
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid={testId} {...props}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search services..."
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FilterDropdown
            title="Category"
            options={categoryOptions}
            selectedValues={columnFilters.find(f => f.id === 'group')?.value as string[] || []}
            onChange={(values) => {
              setColumnFilters(prev => prev.filter(f => f.id !== 'group').concat(
                values.length ? [{ id: 'group', value: values }] : []
              ))
            }}
          />
          
          <FilterDropdown
            title="Status"
            options={statusOptions}
            selectedValues={columnFilters.find(f => f.id === 'status')?.value as string[] || []}
            onChange={(values) => {
              setColumnFilters(prev => prev.filter(f => f.id !== 'status').concat(
                values.length ? [{ id: 'status', value: values }] : []
              ))
            }}
          />

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            Refresh
          </button>

          {renderToolbar?.()}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{
            height: config.table?.virtualScrolling !== false && rows.length > 100 ? '600px' : 'auto'
          }}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <ArrowsUpDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {config.table?.virtualScrolling !== false && rows.length > 100 ? (
                // Virtualized rows for large datasets
                <>
                  <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    <td />
                  </tr>
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = rows[virtualRow.index]
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`
                        }}
                        onClick={() => onRowClick?.(row.original)}
                        onDoubleClick={() => onRowDoubleClick?.(row.original)}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </>
              ) : (
                // Regular rows for smaller datasets
                rows.map(row => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => onRowClick?.(row.original)}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

// Default export
export default ApiDocsList

/**
 * @example
 * // Basic usage
 * <ApiDocsList />
 * 
 * // With custom configuration
 * <ApiDocsList
 *   config={{
 *     table: {
 *       virtualScrolling: true,
 *       pageSize: 25
 *     },
 *     search: {
 *       enabled: true,
 *       placeholder: "Search API services..."
 *     }
 *   }}
 *   onRowClick={(service) => router.push(`/api-docs/${service.id}`)}
 * />
 * 
 * // With custom data and external state management
 * <ApiDocsList
 *   data={customServiceData}
 *   loading={isLoading}
 *   error={error}
 *   searchQuery={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   selection={{ enabled: true, enableMulti: true }}
 *   onSelectionChange={handleSelectionChange}
 * />
 */