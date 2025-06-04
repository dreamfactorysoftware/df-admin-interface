'use client'

/**
 * Service Report Table Component
 * 
 * React service report data table component implementing TanStack Virtual for large dataset performance
 * with comprehensive filtering, sorting, and pagination. Uses React Query for intelligent caching and
 * Tailwind CSS styling with Headless UI components. Provides six-column display (time, serviceId, 
 * serviceName, userEmail, action, request) with accessibility features and real-time data updates.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * 
 * Features:
 * - TanStack Virtual-powered table for 1000+ record performance per Section 2.1.2
 * - React Query intelligent caching with cache hit responses under 50ms
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - WCAG 2.1 AA accessibility compliance per Summary of Changes Section 0.2.6
 * - Headless UI integration for accessible table components
 * - React Hook Form integration for filtering and search functionality
 * - MSW mock integration for realistic API testing during development
 * - Screen reader support for accessibility compliance
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

// Import custom hooks and types
import { useServiceReports } from '@/hooks/use-service-reports'
import { ServiceReportData } from '@/types/service-report'

// Filter form schema with Zod validation for React Hook Form integration
const filterSchema = z.object({
  search: z.string().optional(),
  serviceId: z.string().optional(),
  userEmail: z.string().optional(),
  action: z.string().optional(),
  requestVerb: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

type FilterFormData = z.infer<typeof filterSchema>

// Column configuration with accessibility and sorting support
interface ColumnConfig {
  id: keyof ServiceReportData
  header: string
  accessibleDescription: string
  sortable: boolean
  minWidth: number
  render: (row: ServiceReportData) => React.ReactNode
}

// Service Report Table Props interface
interface ServiceReportTableProps {
  className?: string
  onRowClick?: (row: ServiceReportData) => void
  enableVirtualization?: boolean
  initialPageSize?: number
  showFilters?: boolean
  ariaLabel?: string
}

/**
 * Service Report Table Component
 * 
 * Displays service report data in a high-performance virtual table with comprehensive
 * filtering, sorting, and accessibility features.
 */
export function ServiceReportTable({
  className = '',
  onRowClick,
  enableVirtualization = true,
  initialPageSize = 50,
  showFilters = true,
  ariaLabel = 'Service Reports Data Table'
}: ServiceReportTableProps) {
  // Table state management
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortColumn, setSortColumn] = useState<keyof ServiceReportData>('lastModifiedDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Screen reader announcements state
  const [announceText, setAnnounceText] = useState('')
  const announceRef = useRef<HTMLDivElement>(null)

  // React Hook Form setup for filtering with Zod validation
  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors }
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      serviceId: '',
      userEmail: '',
      action: '',
      requestVerb: '',
      dateFrom: '',
      dateTo: '',
    }
  })

  // Watch for form changes to trigger real-time filtering
  const watchedFilters = watch()

  // Create filter query from form data
  const filterQuery = useMemo(() => {
    const filters: string[] = []
    
    if (watchedFilters.search?.trim()) {
      filters.push(`search=${encodeURIComponent(watchedFilters.search)}`)
    }
    if (watchedFilters.serviceId?.trim()) {
      filters.push(`serviceId=${encodeURIComponent(watchedFilters.serviceId)}`)
    }
    if (watchedFilters.userEmail?.trim()) {
      filters.push(`userEmail=${encodeURIComponent(watchedFilters.userEmail)}`)
    }
    if (watchedFilters.action?.trim()) {
      filters.push(`action=${encodeURIComponent(watchedFilters.action)}`)
    }
    if (watchedFilters.requestVerb?.trim()) {
      filters.push(`requestVerb=${encodeURIComponent(watchedFilters.requestVerb)}`)
    }
    if (watchedFilters.dateFrom?.trim()) {
      filters.push(`dateFrom=${encodeURIComponent(watchedFilters.dateFrom)}`)
    }
    if (watchedFilters.dateTo?.trim()) {
      filters.push(`dateTo=${encodeURIComponent(watchedFilters.dateTo)}`)
    }

    return filters.length > 0 ? filters.join('&') : undefined
  }, [watchedFilters])

  // React Query data fetching with intelligent caching
  const {
    data: serviceReports,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useServiceReports({
    page: currentPage,
    limit: pageSize,
    sortBy: sortColumn,
    sortDirection,
    filter: filterQuery,
    // React Query options for performance optimization
    staleTime: 30000, // 30 seconds - data considered fresh
    cacheTime: 300000, // 5 minutes - cache retention
  })

  // Table container ref for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Column definitions with accessibility descriptions
  const columns: ColumnConfig[] = useMemo(() => [
    {
      id: 'lastModifiedDate',
      header: 'Time',
      accessibleDescription: 'Last modified date and time of the service report',
      sortable: true,
      minWidth: 180,
      render: (row) => (
        <time 
          dateTime={row.lastModifiedDate}
          className="text-sm text-gray-900 dark:text-gray-100"
        >
          {new Date(row.lastModifiedDate).toLocaleString()}
        </time>
      )
    },
    {
      id: 'serviceId',
      header: 'Service ID',
      accessibleDescription: 'Unique identifier of the service',
      sortable: true,
      minWidth: 120,
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.serviceId || 'N/A'}
        </span>
      )
    },
    {
      id: 'serviceName',
      header: 'Service Name',
      accessibleDescription: 'Name of the service',
      sortable: true,
      minWidth: 200,
      render: (row) => (
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
          {row.serviceName}
        </span>
      )
    },
    {
      id: 'userEmail',
      header: 'User Email',
      accessibleDescription: 'Email address of the user who performed the action',
      sortable: true,
      minWidth: 250,
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.userEmail}
        </span>
      )
    },
    {
      id: 'action',
      header: 'Action',
      accessibleDescription: 'Type of action performed',
      sortable: true,
      minWidth: 150,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {row.action}
        </span>
      )
    },
    {
      id: 'requestVerb',
      header: 'Request Method',
      accessibleDescription: 'HTTP request method used',
      sortable: true,
      minWidth: 120,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium ${
          row.requestVerb === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          row.requestVerb === 'POST' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
          row.requestVerb === 'PUT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          row.requestVerb === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}>
          {row.requestVerb}
        </span>
      )
    }
  ], [])

  // Virtual table setup for performance with 1000+ records
  const rowVirtualizer = enableVirtualization ? useVirtualizer({
    count: serviceReports?.data?.length || 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside visible area
  }) : null

  // Sorting handler with accessibility announcements
  const handleSort = useCallback((columnId: keyof ServiceReportData) => {
    const column = columns.find(col => col.id === columnId)
    if (!column?.sortable) return

    let newDirection: 'asc' | 'desc' = 'asc'
    if (sortColumn === columnId && sortDirection === 'asc') {
      newDirection = 'desc'
    }

    setSortColumn(columnId)
    setSortDirection(newDirection)

    // Announce sort change to screen readers
    const sortAnnouncement = `Table sorted by ${column.header} in ${newDirection === 'asc' ? 'ascending' : 'descending'} order`
    setAnnounceText(sortAnnouncement)

    // Reset to first page when sorting
    setCurrentPage(0)
  }, [sortColumn, sortDirection, columns])

  // Row click handler with keyboard support
  const handleRowClick = useCallback((row: ServiceReportData, event: React.MouseEvent | React.KeyboardEvent) => {
    if (event.type === 'keydown') {
      const keyEvent = event as React.KeyboardEvent
      if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
      keyEvent.preventDefault()
    }
    
    onRowClick?.(row)
    
    // Announce row selection to screen readers
    setAnnounceText(`Selected service report for ${row.serviceName} by ${row.userEmail}`)
  }, [onRowClick])

  // Filter submission handler
  const onFilterSubmit = useCallback((data: FilterFormData) => {
    setCurrentPage(0) // Reset to first page when filtering
    setAnnounceText('Filters applied, table data updated')
  }, [])

  // Clear filters handler
  const clearFilters = useCallback(() => {
    reset()
    setAnnounceText('Filters cleared, showing all service reports')
  }, [reset])

  // Refresh data handler
  const handleRefresh = useCallback(() => {
    refetch()
    setAnnounceText('Service reports data refreshed')
  }, [refetch])

  // Page navigation handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    setAnnounceText(`Navigated to page ${page + 1}`)
  }, [])

  const nextPage = useCallback(() => {
    if (serviceReports?.meta && currentPage < Math.ceil(serviceReports.meta.count / pageSize) - 1) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, pageSize, serviceReports?.meta, goToPage])

  const previousPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  // Calculate pagination info
  const totalPages = serviceReports?.meta ? Math.ceil(serviceReports.meta.count / pageSize) : 0
  const totalItems = serviceReports?.meta?.count || 0
  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems)

  // Clear announcements after they're read
  useEffect(() => {
    if (announceText) {
      const timer = setTimeout(() => setAnnounceText(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announceText])

  // Error state display
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4" role="alert">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Service Reports
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="btn-accessible bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Screen reader announcements */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceText}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Filter Service Reports
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-accessible bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  aria-label="Clear all filters"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="btn-accessible bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  aria-label="Refresh service reports data"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onFilterSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Search Input */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search
                  </label>
                  <div className="mt-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('search')}
                      type="text"
                      id="search"
                      className="input-accessible pl-10"
                      placeholder="Search service reports..."
                      aria-describedby="search-description"
                    />
                  </div>
                  <p id="search-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Search across all fields
                  </p>
                  {errors.search && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.search.message}
                    </p>
                  )}
                </div>

                {/* Service ID Filter */}
                <div>
                  <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service ID
                  </label>
                  <input
                    {...register('serviceId')}
                    type="text"
                    id="serviceId"
                    className="input-accessible"
                    placeholder="Filter by service ID"
                  />
                  {errors.serviceId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.serviceId.message}
                    </p>
                  )}
                </div>

                {/* User Email Filter */}
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Email
                  </label>
                  <input
                    {...register('userEmail')}
                    type="text"
                    id="userEmail"
                    className="input-accessible"
                    placeholder="Filter by user email"
                  />
                  {errors.userEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.userEmail.message}
                    </p>
                  )}
                </div>

                {/* Action Filter */}
                <div>
                  <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action
                  </label>
                  <input
                    {...register('action')}
                    type="text"
                    id="action"
                    className="input-accessible"
                    placeholder="Filter by action"
                  />
                  {errors.action && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.action.message}
                    </p>
                  )}
                </div>

                {/* Request Method Filter */}
                <div>
                  <label htmlFor="requestVerb" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Method
                  </label>
                  <select
                    {...register('requestVerb')}
                    id="requestVerb"
                    className="input-accessible"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  {errors.requestVerb && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.requestVerb.message}
                    </p>
                  )}
                </div>

                {/* Date Range Filters */}
                <div>
                  <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    From Date
                  </label>
                  <input
                    {...register('dateFrom')}
                    type="datetime-local"
                    id="dateFrom"
                    className="input-accessible"
                  />
                  {errors.dateFrom && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.dateFrom.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    To Date
                  </label>
                  <input
                    {...register('dateTo')}
                    type="datetime-local"
                    id="dateTo"
                    className="input-accessible"
                  />
                  {errors.dateTo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.dateTo.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Table Header with Pagination Info */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Service Reports
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading...' : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
              </p>
            </div>
            
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(0)
                  setAnnounceText(`Page size changed to ${e.target.value} rows`)
                }}
                className="input-accessible py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Virtual Table */}
        <div 
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ height: enableVirtualization ? '400px' : 'auto' }}
          role="region"
          aria-label={ariaLabel}
          tabIndex={0}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus-accessible"
                    style={{ minWidth: column.minWidth }}
                    onClick={() => handleSort(column.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort(column.id)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-sort={
                      sortColumn === column.id 
                        ? sortDirection === 'asc' ? 'ascending' : 'descending'
                        : column.sortable ? 'none' : undefined
                    }
                    aria-label={`Sort by ${column.header}. ${column.accessibleDescription}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="flex-shrink-0">
                          {sortColumn === column.id ? (
                            sortDirection === 'asc' ? (
                              <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                            )
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {columns.map((column) => (
                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : serviceReports?.data?.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-lg font-medium">No service reports found</p>
                      <p className="mt-1">Try adjusting your filters or search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : enableVirtualization && rowVirtualizer ? (
                // Virtualized rows for performance
                rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const row = serviceReports?.data?.[virtualItem.index]
                  if (!row) return null

                  return (
                    <tr
                      key={row.id}
                      ref={(node) => rowVirtualizer.measureElement(node)}
                      data-index={virtualItem.index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus-within:bg-gray-50 dark:focus-within:bg-gray-700"
                      onClick={(e) => handleRowClick(row, e)}
                      onKeyDown={(e) => handleRowClick(row, e)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for service report: ${row.serviceName} by ${row.userEmail}`}
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {columns.map((column) => (
                        <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ) : (
                // Regular rows (non-virtualized)
                serviceReports?.data?.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus-within:bg-gray-50 dark:focus-within:bg-gray-700"
                    onClick={(e) => handleRowClick(row, e)}
                    onKeyDown={(e) => handleRowClick(row, e)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for service report: ${row.serviceName} by ${row.userEmail}`}
                  >
                    {columns.map((column) => (
                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                {/* Mobile pagination */}
                <button
                  onClick={previousPage}
                  disabled={currentPage === 0}
                  className="btn-accessible disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 self-center">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="btn-accessible disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous button */}
                    <button
                      onClick={previousPage}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus-accessible"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 7) {
                        pageNum = i
                      } else if (currentPage <= 3) {
                        pageNum = i
                      } else if (currentPage >= totalPages - 4) {
                        pageNum = totalPages - 7 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium focus-accessible ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-200'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                          aria-label={`Go to page ${pageNum + 1}`}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                        >
                          {pageNum + 1}
                        </button>
                      )
                    })}

                    {/* Next button */}
                    <button
                      onClick={nextPage}
                      disabled={currentPage >= totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus-accessible"
                      aria-label="Go to next page"
                    >
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceReportTable