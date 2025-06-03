/**
 * @fileoverview Next.js page component providing the main database fields listing interface
 * for a selected table. Implements TanStack Virtual for handling large field datasets,
 * filtering and sorting capabilities, and navigation to individual field creation/editing routes.
 * Replaces Angular field listing functionality with React Query for intelligent caching
 * and Next.js routing integration.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Features:
 * - TanStack Virtual implementation for databases with 1,000+ fields per Section 5.2
 * - React Query caching with cache hit responses under 50ms
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Comprehensive field filtering, sorting, and search functionality
 * - Next.js routing integration for field management workflows
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 */

'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  EyeIcon,
  KeyIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/solid'

// Types and utilities
import type {
  DatabaseSchemaFieldType,
  FieldTableRow,
  DreamFactoryFieldType,
  FieldSearchParams,
  FieldRouteParams,
} from './field.types'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface FieldsPageProps {
  params: FieldRouteParams
  searchParams: FieldSearchParams
}

interface FieldFilterOptions {
  types: DreamFactoryFieldType[]
  constraints: string[]
  nullable: boolean[]
  virtual: boolean[]
}

// =============================================================================
// COLUMN HELPER AND DEFINITIONS
// =============================================================================

const columnHelper = createColumnHelper<FieldTableRow>()

const createFieldColumns = (): ColumnDef<FieldTableRow>[] => [
  columnHelper.accessor('name', {
    header: 'Field Name',
    size: 200,
    minSize: 150,
    cell: ({ row, getValue }) => (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {row.original.isPrimaryKey && (
            <KeyIcon className="w-4 h-4 text-yellow-500" title="Primary Key" />
          )}
          {row.original.isForeignKey && (
            <LinkIcon className="w-4 h-4 text-blue-500" title="Foreign Key" />
          )}
          {row.original.isVirtual && (
            <EyeIcon className="w-4 h-4 text-purple-500" title="Virtual Field" />
          )}
        </div>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {getValue()}
        </span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  }),

  columnHelper.accessor('type', {
    header: 'Type',
    size: 120,
    minSize: 100,
    cell: ({ getValue }) => {
      const type = getValue()
      const getTypeColor = (fieldType: DreamFactoryFieldType) => {
        if (['string', 'text', 'email', 'url'].includes(fieldType)) 
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        if (['integer', 'bigint', 'smallint', 'decimal', 'float', 'double'].includes(fieldType))
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        if (['date', 'time', 'datetime', 'timestamp'].includes(fieldType))
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        if (fieldType === 'boolean')
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
          {type}
        </span>
      )
    },
    enableSorting: true,
    enableColumnFilter: true,
  }),

  columnHelper.accessor('dbType', {
    header: 'Database Type',
    size: 140,
    minSize: 120,
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
        {getValue() || 'N/A'}
      </span>
    ),
    enableSorting: true,
  }),

  columnHelper.accessor('constraints', {
    header: 'Constraints',
    size: 200,
    minSize: 150,
    cell: ({ row }) => {
      const constraints = []
      if (row.original.required) constraints.push('NOT NULL')
      if (row.original.isPrimaryKey) constraints.push('PRIMARY KEY')
      if (row.original.isForeignKey) constraints.push('FOREIGN KEY')
      if (row.original.length) constraints.push(`LENGTH(${row.original.length})`)
      
      return (
        <div className="flex flex-wrap gap-1">
          {constraints.map((constraint, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {constraint}
            </span>
          ))}
        </div>
      )
    },
    enableSorting: false,
  }),

  columnHelper.accessor('default', {
    header: 'Default Value',
    size: 150,
    minSize: 120,
    cell: ({ getValue }) => {
      const defaultValue = getValue()
      return defaultValue ? (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {String(defaultValue)}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-600 italic">
          None
        </span>
      )
    },
    enableSorting: true,
  }),

  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    size: 100,
    minSize: 80,
    cell: ({ row }) => (
      <div className="flex items-center space-x-1">
        <button
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          title="Edit Field"
          onClick={() => handleEditField(row.original.name)}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>
    ),
    enableSorting: false,
  }),
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Transforms DatabaseSchemaFieldType to FieldTableRow for table display
 */
const transformFieldToTableRow = (field: DatabaseSchemaFieldType): FieldTableRow => ({
  id: field.name,
  name: field.name,
  alias: field.alias || '',
  type: field.type,
  dbType: field.dbType || '',
  isVirtual: field.isVirtual,
  isAggregate: field.isAggregate,
  required: field.required,
  constraints: buildConstraintsString(field),
  isPrimaryKey: field.isPrimaryKey,
  isForeignKey: field.isForeignKey,
  refTable: field.refTable || undefined,
  length: field.length || undefined,
  default: field.default ?? undefined,
})

/**
 * Builds a constraints summary string for display
 */
const buildConstraintsString = (field: DatabaseSchemaFieldType): string => {
  const constraints = []
  if (field.required) constraints.push('NOT NULL')
  if (field.isPrimaryKey) constraints.push('PK')
  if (field.isForeignKey) constraints.push('FK')
  if (field.isUnique) constraints.push('UNIQUE')
  if (field.autoIncrement) constraints.push('AUTO_INCREMENT')
  return constraints.join(', ')
}

/**
 * Navigation handlers
 */
let routerRef: ReturnType<typeof useRouter> | null = null

const handleEditField = (fieldName: string) => {
  if (routerRef) {
    routerRef.push(`/adf-schema/fields/${encodeURIComponent(fieldName)}`)
  }
}

const handleCreateField = () => {
  if (routerRef) {
    routerRef.push('/adf-schema/fields/new')
  }
}

// =============================================================================
// MOCK API CLIENT (replace with actual implementation)
// =============================================================================

/**
 * Mock API client - replace with actual implementation from src/lib/api-client.ts
 */
const mockApiClient = {
  async getTableFields(serviceName: string, tableName: string): Promise<DatabaseSchemaFieldType[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    
    // Mock data for development - replace with actual API call
    const mockFields: DatabaseSchemaFieldType[] = Array.from({ length: 50 }, (_, i) => ({
      name: `field_${i + 1}`,
      alias: i % 3 === 0 ? `alias_${i + 1}` : null,
      label: `Field ${i + 1}`,
      type: ['string', 'integer', 'boolean', 'datetime', 'text'][i % 5] as DreamFactoryFieldType,
      dbType: ['VARCHAR(255)', 'INT', 'BOOLEAN', 'DATETIME', 'TEXT'][i % 5],
      required: i % 4 === 0,
      allowNull: i % 4 !== 0,
      isPrimaryKey: i === 0,
      isForeignKey: i % 7 === 0 && i > 0,
      isUnique: i % 5 === 0,
      isVirtual: i % 10 === 0,
      isAggregate: false,
      autoIncrement: i === 0,
      length: i % 3 === 0 ? 255 : null,
      precision: null,
      scale: 0,
      default: i % 6 === 0 ? `default_${i}` : null,
      description: `Description for field ${i + 1}`,
      fixedLength: false,
      supportsMultibyte: i % 2 === 0,
      refTable: i % 7 === 0 && i > 0 ? `ref_table_${i}` : null,
      refField: i % 7 === 0 && i > 0 ? `ref_field_${i}` : null,
      refOnDelete: null,
      refOnUpdate: null,
      validation: null,
      picklist: null,
      dbFunction: [],
      native: null,
      value: [],
    }))
    
    return mockFields
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Fields listing page component
 */
export default function FieldsPage({ params, searchParams }: FieldsPageProps) {
  const router = useRouter()
  routerRef = router // Set global router reference for action handlers
  
  const urlSearchParams = useSearchParams()
  
  // Extract route parameters
  const { service: serviceName, table: tableName } = params
  
  // State management
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState(searchParams.search || '')
  const [typeFilter, setTypeFilter] = useState<DreamFactoryFieldType | 'all'>('all')
  const [constraintFilter, setConstraintFilter] = useState<string>('all')
  
  // React Query for field data fetching with intelligent caching
  const {
    data: fieldsData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['table-fields', serviceName, tableName],
    queryFn: () => mockApiClient.getTableFields(serviceName, tableName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!(serviceName && tableName),
  })

  // Transform data for table display
  const tableData = useMemo(() => 
    fieldsData.map(transformFieldToTableRow),
    [fieldsData]
  )

  // Column definitions
  const columns = useMemo(() => createFieldColumns(), [])

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = tableData

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(row => row.type === typeFilter)
    }

    // Constraint filter
    if (constraintFilter !== 'all') {
      filtered = filtered.filter(row => {
        switch (constraintFilter) {
          case 'primary_key':
            return row.isPrimaryKey
          case 'foreign_key':
            return row.isForeignKey
          case 'required':
            return row.required
          case 'virtual':
            return row.isVirtual
          default:
            return true
        }
      })
    }

    return filtered
  }, [tableData, typeFilter, constraintFilter])

  // Table configuration
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  })

  // Virtualization setup for large datasets
  const tableContainerRef = useState<HTMLDivElement | null>(null)[0]
  const { rows } = table.getRowModel()
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef,
    estimateSize: () => 60, // Estimated row height
    overscan: 10,
  })

  // Extract unique filter options
  const filterOptions: FieldFilterOptions = useMemo(() => ({
    types: Array.from(new Set(tableData.map(field => field.type))),
    constraints: ['primary_key', 'foreign_key', 'required', 'virtual'],
    nullable: [true, false],
    virtual: [true, false],
  }), [tableData])

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (globalFilter) params.set('search', globalFilter)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (constraintFilter !== 'all') params.set('constraint', constraintFilter)
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState(null, '', newUrl)
  }, [globalFilter, typeFilter, constraintFilter])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Fields
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load table fields'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Fields: {tableName}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Service: {serviceName} • {filteredData.length} field{filteredData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleCreateField}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Field
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search fields..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DreamFactoryFieldType | 'all')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm"
              >
                <option value="all">All Types</option>
                {filterOptions.types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Constraint Filter */}
            <div>
              <select
                value={constraintFilter}
                onChange={(e) => setConstraintFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm"
              >
                <option value="all">All Constraints</option>
                <option value="primary_key">Primary Key</option>
                <option value="foreign_key">Foreign Key</option>
                <option value="required">Required</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  setGlobalFilter('')
                  setTypeFilter('all')
                  setConstraintFilter('all')
                  setColumnFilters([])
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div
              ref={tableContainerRef}
              className="max-h-[600px] overflow-auto"
              style={{ contain: 'strict' }}
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
                          <div className="flex items-center space-x-1">
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanSort() && (
                              <span className="flex flex-col">
                                <ArrowUpIcon 
                                  className={`w-3 h-3 ${
                                    header.column.getIsSorted() === 'asc' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`} 
                                />
                                <ArrowDownIcon 
                                  className={`w-3 h-3 -mt-1 ${
                                    header.column.getIsSorted() === 'desc' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`} 
                                />
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = rows[virtualRow.index]
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer */}
          {filteredData.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Fields Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {globalFilter || typeFilter !== 'all' || constraintFilter !== 'all'
                  ? 'No fields match your current filters.'
                  : 'This table has no fields defined yet.'}
              </p>
              {(globalFilter || typeFilter !== 'all' || constraintFilter !== 'all') && (
                <button
                  onClick={() => {
                    setGlobalFilter('')
                    setTypeFilter('all')
                    setConstraintFilter('all')
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Performance Stats (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div>Total Fields: {tableData.length}</div>
            <div>Filtered Fields: {filteredData.length}</div>
            <div>Virtual Rows: {rowVirtualizer.getVirtualItems().length}</div>
          </div>
        )}
      </div>
    </div>
  )
}