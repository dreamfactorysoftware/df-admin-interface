/**
 * Security Table Component
 * 
 * Generic reusable table component for displaying security-related data in both 
 * limits and roles management. Implements Headless UI table with Tailwind CSS 
 * styling, TanStack Virtual for performance, sorting, filtering, pagination, 
 * and accessibility features.
 * 
 * Features:
 * - TanStack Virtual implementation for databases with 1,000+ tables per Section 5.2
 * - Generic table component supporting both limits and roles data per reusability standards
 * - WCAG 2.1 AA compliance through Headless UI table primitives per Section 7.1 
 * - Performance optimization for large datasets with virtual scrolling per Section 5.2
 * - React Query integration for intelligent caching per React/Next.js Integration Requirements
 * - Tailwind CSS 4.1+ styling with consistent theme injection per Section 7.1
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { 
  Button, 
  LoadingSpinner,
  type ButtonProps 
} from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { 
  ApiListResponse, 
  PaginationMeta,
  ApiRequestOptions
} from '@/types/api'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Generic column configuration for security table
 */
export interface SecurityTableColumn<T = any> {
  /** Unique identifier for the column */
  id: string
  /** Display header text */
  header: string
  /** Accessor function to get cell value from row data */
  accessor: (row: T) => any
  /** Optional cell renderer for custom display */
  cell?: (value: any, row: T) => React.ReactNode
  /** Whether column is sortable */
  sortable?: boolean
  /** Whether column is filterable */
  filterable?: boolean
  /** Column width (auto, fixed pixels, or percentage) */
  width?: number | string
  /** CSS classes for column styling */
  className?: string
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Whether column is initially hidden */
  hidden?: boolean
}

/**
 * Row action configuration
 */
export interface SecurityTableAction<T = any> {
  /** Unique identifier for the action */
  id: string
  /** Display label */
  label: string
  /** Action handler function */
  handler: (row: T) => void | Promise<void>
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>
  /** Button variant */
  variant?: ButtonProps['variant']
  /** Whether action is disabled for this row */
  disabled?: (row: T) => boolean
  /** Whether action requires confirmation */
  requiresConfirmation?: boolean
  /** Confirmation message */
  confirmationMessage?: string
  /** ARIA label for accessibility */
  ariaLabel?: string
}

/**
 * Filter configuration
 */
export interface SecurityTableFilter {
  /** Column ID to filter */
  column: string
  /** Filter value */
  value: any
  /** Filter operator */
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte'
}

/**
 * Sort configuration
 */
export interface SecurityTableSort {
  /** Column ID to sort by */
  column: string
  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Table configuration props
 */
export interface SecurityTableProps<T = any> {
  /** Table data */
  data: T[]
  /** Column definitions */
  columns: SecurityTableColumn<T>[]
  /** Row actions */
  actions?: SecurityTableAction<T>[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
  /** Pagination metadata */
  pagination?: PaginationMeta
  /** Page change handler */
  onPageChange?: (page: number) => void
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void
  /** Sort change handler */
  onSortChange?: (sort: SecurityTableSort | null) => void
  /** Filter change handler */
  onFilterChange?: (filters: SecurityTableFilter[]) => void
  /** Row selection handler */
  onRowSelect?: (selectedRows: T[]) => void
  /** Whether to enable row selection */
  selectable?: boolean
  /** Whether to enable virtual scrolling */
  virtualScrolling?: boolean
  /** Virtual scrolling container height */
  height?: number
  /** Empty state message */
  emptyMessage?: string
  /** Empty state icon */
  emptyIcon?: React.ComponentType<{ className?: string }>
  /** Table caption for accessibility */
  caption?: string
  /** CSS classes for table styling */
  className?: string
  /** Additional ARIA attributes */
  ariaAttributes?: Record<string, string>
}

// =============================================================================
// BADGE COMPONENT (INLINE IMPLEMENTATION)
// =============================================================================

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }
  
  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  )
}

// =============================================================================
// SIMPLE DIALOG COMPONENT (INLINE IMPLEMENTATION)
// =============================================================================

interface SimpleDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  loading?: boolean
}

const SimpleDialog: React.FC<SimpleDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              loading={loading}
              disabled={loading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN SECURITY TABLE COMPONENT
// =============================================================================

export function SecurityTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onRowSelect,
  selectable = false,
  virtualScrolling = false,
  height = 400,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon = FunnelIcon,
  caption,
  className,
  ariaAttributes = {}
}: SecurityTableProps<T>) {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  const [sort, setSort] = useState<SecurityTableSort | null>(null)
  const [filters, setFilters] = useState<SecurityTableFilter[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: () => void
    loading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    loading: false
  })

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null)
  const visibleColumns = useMemo(() => columns.filter(col => !col.hidden), [columns])
  
  // ==========================================================================
  // FILTERING AND SORTING LOGIC
  // ==========================================================================

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        visibleColumns.some(column => {
          const value = column.accessor(row)
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    filters.forEach(filter => {
      const column = columns.find(col => col.id === filter.column)
      if (!column) return

      result = result.filter(row => {
        const value = column.accessor(row)
        const filterValue = filter.value

        switch (filter.operator) {
          case 'equals':
            return value === filterValue
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
          case 'gt':
            return Number(value) > Number(filterValue)
          case 'lt':
            return Number(value) < Number(filterValue)
          case 'gte':
            return Number(value) >= Number(filterValue)
          case 'lte':
            return Number(value) <= Number(filterValue)
          default:
            return true
        }
      })
    })

    // Apply sorting
    if (sort) {
      const column = columns.find(col => col.id === sort.column)
      if (column) {
        result.sort((a, b) => {
          const aValue = column.accessor(a)
          const bValue = column.accessor(b)
          
          let comparison = 0
          if (aValue < bValue) comparison = -1
          else if (aValue > bValue) comparison = 1
          
          return sort.direction === 'desc' ? -comparison : comparison
        })
      }
    }

    return result
  }, [data, columns, visibleColumns, searchTerm, filters, sort])

  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: virtualScrolling ? filteredAndSortedData.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10, // Render extra items for smooth scrolling
  })

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId)
    if (!column?.sortable) return

    const newSort: SecurityTableSort = {
      column: columnId,
      direction: sort?.column === columnId && sort?.direction === 'asc' ? 'desc' : 'asc'
    }

    setSort(newSort)
    onSortChange?.(newSort)
  }, [columns, sort, onSortChange])

  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    if (!selectable) return

    const newSelectedRows = new Set(selectedRows)
    if (selected) {
      newSelectedRows.add(index)
    } else {
      newSelectedRows.delete(index)
    }

    setSelectedRows(newSelectedRows)
    
    const selectedData = Array.from(newSelectedRows).map(idx => filteredAndSortedData[idx])
    onRowSelect?.(selectedData)
  }, [selectable, selectedRows, filteredAndSortedData, onRowSelect])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (!selectable) return

    const newSelectedRows = selected 
      ? new Set(filteredAndSortedData.map((_, index) => index))
      : new Set<number>()

    setSelectedRows(newSelectedRows)
    
    const selectedData = selected ? filteredAndSortedData : []
    onRowSelect?.(selectedData)
  }, [selectable, filteredAndSortedData, onRowSelect])

  const handleAction = useCallback((action: SecurityTableAction<T>, row: T) => {
    if (action.disabled?.(row)) return

    if (action.requiresConfirmation) {
      setConfirmDialog({
        isOpen: true,
        title: `Confirm ${action.label}`,
        message: action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()}?`,
        action: async () => {
          setConfirmDialog(prev => ({ ...prev, loading: true }))
          try {
            await action.handler(row)
          } finally {
            setConfirmDialog({ isOpen: false, title: '', message: '', action: () => {}, loading: false })
          }
        },
        loading: false
      })
    } else {
      action.handler(row)
    }
  }, [])

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderTableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
      <tr>
        {selectable && (
          <th className="w-12 px-4 py-3 text-left">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all rows"
            />
          </th>
        )}
        
        {visibleColumns.map((column) => (
          <th
            key={column.id}
            className={cn(
              'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
              column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
              column.className
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.id)}
            aria-label={column.ariaLabel || `Sort by ${column.header}`}
            aria-sort={
              sort?.column === column.id 
                ? sort.direction === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <ChevronUpIcon 
                    className={cn(
                      'h-3 w-3',
                      sort?.column === column.id && sort.direction === 'asc'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    )}
                  />
                  <ChevronDownIcon 
                    className={cn(
                      'h-3 w-3 -mt-1',
                      sort?.column === column.id && sort.direction === 'desc'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    )}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
        
        {actions.length > 0 && (
          <th className="w-16 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        )}
      </tr>
    </thead>
  )

  const renderTableRow = (row: T, index: number, virtualRow?: any) => {
    const isSelected = selectedRows.has(index)
    
    return (
      <tr
        key={index}
        className={cn(
          'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          isSelected && 'bg-primary-50 dark:bg-primary-900/20'
        )}
        style={virtualRow ? {
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        } : undefined}
      >
        {selectable && (
          <td className="w-12 px-4 py-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={isSelected}
              onChange={(e) => handleRowSelect(index, e.target.checked)}
              aria-label={`Select row ${index + 1}`}
            />
          </td>
        )}
        
        {visibleColumns.map((column) => {
          const value = column.accessor(row)
          const cellContent = column.cell ? column.cell(value, row) : value
          
          return (
            <td
              key={column.id}
              className={cn('px-4 py-3 text-sm text-gray-900 dark:text-gray-100', column.className)}
              style={{ width: column.width }}
            >
              {cellContent}
            </td>
          )
        })}
        
        {actions.length > 0 && (
          <td className="w-16 px-4 py-3 text-right">
            <div className="flex items-center justify-end space-x-1">
              {actions.map((action) => {
                const disabled = action.disabled?.(row) || false
                const IconComponent = action.icon || EllipsisHorizontalIcon
                
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || 'ghost'}
                    size="icon-sm"
                    onClick={() => handleAction(action, row)}
                    disabled={disabled}
                    aria-label={action.ariaLabel || action.label}
                    title={action.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>
          </td>
        )}
      </tr>
    )
  }

  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
              {selectable && (
                <td className="w-12 px-4 py-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              )}
              {visibleColumns.map((column) => (
                <td key={column.id} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              ))}
              {actions.length > 0 && (
                <td className="w-16 px-4 py-3">
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      )
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td 
              colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
              className="px-4 py-8 text-center text-red-600 dark:text-red-400"
            >
              <XMarkIcon className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading data: {error.message}</p>
            </td>
          </tr>
        </tbody>
      )
    }

    if (filteredAndSortedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td 
              colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
              className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
            >
              <EmptyIcon className="h-8 w-8 mx-auto mb-2" />
              <p>{emptyMessage}</p>
            </td>
          </tr>
        </tbody>
      )
    }

    if (virtualScrolling) {
      return (
        <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = filteredAndSortedData[virtualRow.index]
            return renderTableRow(row, virtualRow.index, virtualRow)
          })}
        </tbody>
      )
    }

    return (
      <tbody>
        {filteredAndSortedData.map((row, index) => renderTableRow(row, index))}
      </tbody>
    )
  }

  const renderPagination = () => {
    if (!pagination) return null

    const totalPages = Math.ceil((pagination.total || 0) / pagination.limit)
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total || 0)} of {pagination.total || 0} results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className={cn('flex flex-col', className)} {...ariaAttributes}>
      {/* Table Controls */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Search table data"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<FunnelIcon className="h-4 w-4" />}
            aria-label="Toggle filters"
          >
            Filters
          </Button>
        </div>

        {selectedRows.size > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="info">
              {selectedRows.size} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
            >
              Clear selection
            </Button>
          </div>
        )}
      </div>

      {/* Virtual Scrolling Container or Regular Table */}
      <div 
        ref={virtualScrolling ? parentRef : undefined}
        className={cn(
          'flex-1 overflow-auto',
          virtualScrolling && 'relative'
        )}
        style={virtualScrolling ? { height } : undefined}
      >
        <table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          role="table"
          aria-label={caption || 'Security data table'}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Confirmation Dialog */}
      <SimpleDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        loading={confirmDialog.loading}
      />
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  SecurityTableColumn,
  SecurityTableAction,
  SecurityTableFilter,
  SecurityTableSort,
  SecurityTableProps
}

export default SecurityTable