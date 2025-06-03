'use client'

/**
 * API Documentation Table Component
 * 
 * React table component for displaying paginated, filterable API documentation entries
 * using modern React patterns. Replaces the Angular DfApiDocsTableComponent with
 * React Query for data fetching, TanStack Virtual for performance optimization,
 * and Headless UI for accessible table controls.
 * 
 * Features:
 * - TanStack Virtual implementation for databases with 1000+ tables per F-002 requirements
 * - React Query-powered data fetching with intelligent caching per performance requirements
 * - Headless UI components for accessible table controls per WCAG 2.1 AA compliance
 * - Tailwind CSS styling with responsive design patterns per Section 7.1.1 framework stack
 * - Performance optimization for large datasets using virtualization per scalability considerations
 * 
 * Performance Targets:
 * - Tree expansion within 200ms for large schemas (>1000 tables)
 * - Cache hit responses under 50ms
 * - SSR pages under 2 seconds
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import { useDebounce } from '@/hooks/use-debounce'
import { useSystemApi } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API Documentation row data structure
 * Matches the original Angular implementation for compatibility
 */
export interface ApiDocsRowData {
  name: string
  label: string
  description: string
  group: string
  type: string
}

/**
 * Service type definition for API docs
 */
export interface ServiceType {
  name: string
  label: string
  group: string
  description: string
}

/**
 * Service entity from DreamFactory API
 */
export interface Service {
  id: number
  name: string
  label: string
  description: string
  type: string
  isActive: boolean
  createdDate: string
  lastModifiedDate: string
}

/**
 * Filter options for the table
 */
export interface FilterOptions {
  search: string
  group: string
  type: string
  sortBy: 'name' | 'label' | 'type' | 'group'
  sortOrder: 'asc' | 'desc'
}

/**
 * Column definition for the table
 */
export interface TableColumn {
  key: keyof ApiDocsRowData
  label: string
  sortable: boolean
  className?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter query generator for API docs
 * Matches the original Angular implementation
 */
const getApiDocsFilterQuery = (searchValue: string): string => {
  if (!searchValue.trim()) return ''
  return `(name like "%${searchValue}%") or (label like "%${searchValue}%") or (description like "%${searchValue}%")`
}

/**
 * Maps services to table row data
 * Filters and sorts according to original implementation
 */
const mapServicesToTableData = (
  services: Service[], 
  serviceTypes: ServiceType[]
): ApiDocsRowData[] => {
  const filteredServices = services
    .filter(service => service.isActive === true)
    .sort((a, b) => a.name.localeCompare(b.name))

  return filteredServices.map(service => {
    const serviceType = serviceTypes.find(type => type.name === service.type)
    return {
      name: service.name,
      label: service.label,
      description: service.description,
      group: serviceType?.group ?? '',
      type: serviceType?.label ?? service.type,
    }
  })
}

/**
 * Applies client-side filtering to table data
 */
const applyFilters = (
  data: ApiDocsRowData[],
  filters: FilterOptions
): ApiDocsRowData[] => {
  let filtered = data

  // Search filter
  if (filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase()
    filtered = filtered.filter(row => 
      row.name.toLowerCase().includes(searchTerm) ||
      row.label.toLowerCase().includes(searchTerm) ||
      row.description.toLowerCase().includes(searchTerm)
    )
  }

  // Group filter
  if (filters.group && filters.group !== 'all') {
    filtered = filtered.filter(row => row.group === filters.group)
  }

  // Type filter
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(row => row.type === filters.type)
  }

  // Sorting
  filtered.sort((a, b) => {
    const aValue = a[filters.sortBy]
    const bValue = b[filters.sortBy]
    const comparison = aValue.localeCompare(bValue)
    return filters.sortOrder === 'asc' ? comparison : -comparison
  })

  return filtered
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ApiDocsTableProps {
  /**
   * Optional class name for styling
   */
  className?: string
  
  /**
   * Optional initial filters
   */
  initialFilters?: Partial<FilterOptions>
  
  /**
   * Callback when a row is selected
   */
  onRowSelect?: (row: ApiDocsRowData) => void
  
  /**
   * Whether to show the refresh button
   */
  showRefresh?: boolean
}

/**
 * API Documentation Table Component
 * 
 * Displays a virtualized, filterable, sortable table of API documentation entries
 * with performance optimization for large datasets and full accessibility support.
 */
export function ApiDocsTable({ 
  className,
  initialFilters = {},
  onRowSelect,
  showRefresh = true
}: ApiDocsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentRef = useRef<HTMLDivElement>(null)

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [filters, setFilters] = useState<FilterOptions>({
    search: searchParams.get('search') || '',
    group: searchParams.get('group') || 'all',
    type: searchParams.get('type') || 'all',
    sortBy: (searchParams.get('sortBy') as FilterOptions['sortBy']) || 'name',
    sortOrder: (searchParams.get('sortOrder') as FilterOptions['sortOrder']) || 'asc',
    ...initialFilters
  })

  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(filters.search, 300)

  // ============================================================================
  // DATA FETCHING WITH REACT QUERY
  // ============================================================================

  const systemApi = useSystemApi()

  // Fetch service types for mapping
  const {
    data: serviceTypesResponse,
    isLoading: serviceTypesLoading,
    error: serviceTypesError
  } = useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const response = await systemApi.enhancedFetch('/api/v2/system/service_type')
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch services with intelligent caching
  const {
    data: servicesResponse,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['api-docs-services', debouncedSearch],
    queryFn: async () => {
      const searchFilter = debouncedSearch ? getApiDocsFilterQuery(debouncedSearch) : ''
      const baseFilter = '(type not like "%swagger%")'
      const filter = searchFilter ? `${baseFilter} and ${searchFilter}` : baseFilter

      const response = await systemApi.enhancedFetch('/api/v2/system/service', {}, {
        limit: 1000, // Large limit to get all services for client-side filtering
        filter,
        sort: 'name',
      })
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - per React Query requirements
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const serviceTypes = useMemo<ServiceType[]>(() => {
    if (!serviceTypesResponse?.resource) return []
    return serviceTypesResponse.resource
  }, [serviceTypesResponse])

  const services = useMemo<Service[]>(() => {
    if (!servicesResponse?.resource) return []
    return servicesResponse.resource
  }, [servicesResponse])

  const tableData = useMemo<ApiDocsRowData[]>(() => {
    const mappedData = mapServicesToTableData(services, serviceTypes)
    return applyFilters(mappedData, filters)
  }, [services, serviceTypes, filters])

  // ============================================================================
  // VIRTUALIZATION SETUP
  // ============================================================================

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Render 10 extra items for smooth scrolling
  })

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, className: 'font-medium' },
    { key: 'label', label: 'Label', sortable: true },
    { key: 'description', label: 'Description', sortable: false, className: 'max-w-xs truncate' },
    { key: 'group', label: 'Group', sortable: true },
    { key: 'type', label: 'Type', sortable: true }
  ]

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((sortBy: FilterOptions['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const handleRowClick = useCallback((row: ApiDocsRowData) => {
    if (onRowSelect) {
      onRowSelect(row)
    } else {
      // Default navigation behavior - navigate to detailed view
      router.push(`/adf-api-docs/df-api-docs/${row.name}`)
    }
  }, [router, onRowSelect])

  const handleRefresh = useCallback(() => {
    refetchServices()
  }, [refetchServices])

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  const isLoading = servicesLoading || serviceTypesLoading
  const hasError = servicesError || serviceTypesError
  const isEmpty = tableData.length === 0
  
  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(tableData.map(row => row.group))).filter(Boolean).sort()
  }, [tableData])

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(tableData.map(row => row.type))).filter(Boolean).sort()
  }, [tableData])

  // ============================================================================
  // URL SYNCHRONIZATION
  // ============================================================================

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.group !== 'all') params.set('group', filters.group)
    if (filters.type !== 'all') params.set('type', filters.type)
    if (filters.sortBy !== 'name') params.set('sortBy', filters.sortBy)
    if (filters.sortOrder !== 'asc') params.set('sortOrder', filters.sortOrder)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    if (newUrl !== `?${searchParams.toString()}`) {
      router.replace(newUrl, { scroll: false })
    }
  }, [filters, router, searchParams])

  // ============================================================================
  // RENDER HELPER FUNCTIONS
  // ============================================================================

  const renderTableHeader = () => (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-5 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "flex items-center space-x-1",
              column.sortable && "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            )}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            <span>{column.label}</span>
            {column.sortable && filters.sortBy === column.key && (
              filters.sortOrder === 'asc' 
                ? <ChevronUpIcon className="w-4 h-4" />
                : <ChevronDownIcon className="w-4 h-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderTableRow = (row: ApiDocsRowData, index: number) => (
    <div
      key={`${row.name}-${index}`}
      className={cn(
        "grid grid-cols-5 gap-4 px-6 py-4 cursor-pointer transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-700",
        "border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      )}
      onClick={() => handleRowClick(row)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRowClick(row)
        }
      }}
    >
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {row.name}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
        {row.label}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={row.description}>
        {row.description}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
        {row.group}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
        {row.type}
      </div>
    </div>
  )

  const renderFilterDialog = () => (
    <Transition show={showFilters}>
      <Dialog onClose={() => setShowFilters(false)} className="relative z-50">
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-md rounded bg-white dark:bg-gray-800 p-6 shadow-xl">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Filter API Documentation
              </Dialog.Title>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group
                  </label>
                  <select
                    value={filters.group}
                    onChange={(e) => handleFilterChange('group', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Groups</option>
                    {uniqueGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, group: 'all', type: 'all' }))
                    setShowFilters(false)
                  }}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Apply
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )

  // ============================================================================
  // ERROR AND LOADING STATES
  // ============================================================================

  if (hasError) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error loading API documentation
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {servicesError?.message || serviceTypesError?.message || 'Something went wrong'}
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              "inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              (filters.group !== 'all' || filters.type !== 'all') && "bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
            )}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Results Count and Refresh */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Loading...' : `${tableData.length} services`}
          </span>
          
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No API documentation found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.group !== 'all' || filters.type !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'No services are available for API documentation.'}
            </p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-full overflow-auto"
            role="table"
            aria-label="API Documentation Services"
          >
            {/* Table Header */}
            {renderTableHeader()}

            {/* Virtualized Table Body */}
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {renderTableRow(tableData[virtualItem.index], virtualItem.index)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      {renderFilterDialog()}
    </div>
  )
}

export default ApiDocsTable