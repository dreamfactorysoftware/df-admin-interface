/**
 * Table Component for React/Next.js Migration
 * 
 * Accessible, responsive table components with WCAG 2.1 AA compliance.
 * Replaces Angular Material table with Tailwind CSS implementation
 * supporting sorting, pagination, selection, and keyboard navigation.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// =============================================================================
// VARIANT DEFINITIONS
// =============================================================================

const tableVariants = cva(
  'w-full caption-bottom text-sm',
  {
    variants: {
      variant: {
        default: 'border-collapse',
        separated: 'border-separate border-spacing-0',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

const tableHeaderVariants = cva(
  'border-b border-gray-200 dark:border-gray-700',
  {
    variants: {
      sticky: {
        true: 'sticky top-0 z-10 bg-white dark:bg-gray-900',
        false: '',
      },
    },
    defaultVariants: {
      sticky: false,
    },
  }
)

const tableRowVariants = cva(
  'border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
  {
    variants: {
      selected: {
        true: 'bg-primary-50 dark:bg-primary-900/20',
        false: '',
      },
      clickable: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      selected: false,
      clickable: false,
    },
  }
)

const tableCellVariants = cva(
  'p-4 align-middle',
  {
    variants: {
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
      size: {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      align: 'left',
      size: 'md',
    },
  }
)

const tableHeaderCellVariants = cva(
  'h-12 px-4 text-left align-middle font-medium text-gray-900 dark:text-gray-100',
  {
    variants: {
      sortable: {
        true: 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800',
        false: '',
      },
      sorted: {
        asc: 'bg-gray-50 dark:bg-gray-800',
        desc: 'bg-gray-50 dark:bg-gray-800',
        none: '',
      },
    },
    defaultVariants: {
      sortable: false,
      sorted: 'none',
    },
  }
)

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface TableColumn<T = any> {
  id: string
  header: string | React.ReactNode
  accessor?: keyof T | ((row: T) => React.ReactNode)
  cell?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
}

export interface TableProps<T = any>
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  empty?: React.ReactNode
  caption?: string
  stickyHeader?: boolean
  selectable?: boolean
  selectedRows?: Set<string | number>
  onRowSelect?: (row: T, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  onRowClick?: (row: T, index: number) => void
  sortBy?: { column: string; direction: 'asc' | 'desc' }
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  emptyMessage?: string
  loadingRows?: number
}

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {
  children: React.ReactNode
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {
  children: React.ReactNode
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {
  children: React.ReactNode
}

export interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableHeaderCellElement>,
    VariantProps<typeof tableHeaderCellVariants> {
  children: React.ReactNode
  onSort?: () => void
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Sort icon component
 */
const SortIcon: React.FC<{ direction?: 'asc' | 'desc' | 'none' }> = ({ direction = 'none' }) => {
  return (
    <span className="inline-flex flex-col ml-2">
      <svg
        className={cn(
          'h-3 w-3 -mb-0.5',
          direction === 'asc' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M10 3L15 8H5L10 3Z" />
      </svg>
      <svg
        className={cn(
          'h-3 w-3',
          direction === 'desc' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M10 17L15 12H5L10 17Z" />
      </svg>
    </span>
  )
}

/**
 * Loading skeleton row
 */
const LoadingRow: React.FC<{ columns: number; cellSize?: 'sm' | 'md' | 'lg' }> = ({ 
  columns, 
  cellSize = 'md' 
}) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index} size={cellSize}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </TableCell>
    ))}
  </TableRow>
)

/**
 * Empty state component
 */
const EmptyState: React.FC<{ 
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}> = ({ 
  message = 'No data available',
  icon,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
    {icon && <div className="mb-4">{icon}</div>}
    <p className="text-sm font-medium mb-2">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)

// =============================================================================
// BASE COMPONENTS
// =============================================================================

/**
 * Table component
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({
    className,
    variant,
    size,
    data,
    columns,
    loading = false,
    empty,
    caption,
    stickyHeader = false,
    selectable = false,
    selectedRows = new Set(),
    onRowSelect,
    onSelectAll,
    onRowClick,
    sortBy,
    onSort,
    emptyMessage,
    loadingRows = 5,
    ...props
  }, ref) => {
    
    // Handle select all checkbox
    const handleSelectAll = (checked: boolean) => {
      onSelectAll?.(checked)
    }

    // Handle individual row selection
    const handleRowSelect = (row: any, checked: boolean) => {
      onRowSelect?.(row, checked)
    }

    // Handle column sorting
    const handleSort = (columnId: string) => {
      if (!onSort) return
      
      let newDirection: 'asc' | 'desc' = 'asc'
      if (sortBy?.column === columnId && sortBy.direction === 'asc') {
        newDirection = 'desc'
      }
      
      onSort(columnId, newDirection)
    }

    // Get cell value from row
    const getCellValue = (row: any, column: TableColumn) => {
      if (column.cell) {
        return column.cell(
          column.accessor ? (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) : row,
          row,
          data.indexOf(row)
        )
      }
      
      if (column.accessor) {
        return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]
      }
      
      return null
    }

    // Check if all rows are selected
    const allSelected = selectable && data.length > 0 && data.every(row => 
      selectedRows.has(row.id || data.indexOf(row))
    )

    // Check if some rows are selected
    const someSelected = selectable && selectedRows.size > 0 && !allSelected

    return (
      <div className="relative overflow-auto">
        <table
          ref={ref}
          className={cn(tableVariants({ variant, size }), className)}
          {...props}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          
          <TableHeader sticky={stickyHeader}>
            <TableRow>
              {/* Select all checkbox */}
              {selectable && (
                <TableHeaderCell className="w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </TableHeaderCell>
              )}
              
              {/* Column headers */}
              {columns.map((column) => (
                <TableHeaderCell
                  key={column.id}
                  className={cn(column.headerClassName)}
                  style={{ width: column.width }}
                  sortable={column.sortable}
                  sorted={sortBy?.column === column.id ? sortBy.direction : 'none'}
                  onSort={column.sortable ? () => handleSort(column.id) : undefined}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && (
                      <SortIcon 
                        direction={sortBy?.column === column.id ? sortBy.direction : 'none'} 
                      />
                    )}
                  </div>
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              // Loading state
              Array.from({ length: loadingRows }).map((_, index) => (
                <LoadingRow 
                  key={`loading-${index}`}
                  columns={columns.length + (selectable ? 1 : 0)}
                  cellSize={size}
                />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center"
                >
                  {empty || (
                    <EmptyState 
                      message={emptyMessage || 'No data available'}
                      icon={
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-3 3m0 0l-3-3m3 3v12" />
                        </svg>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row, index) => {
                const rowId = row.id || index
                const isSelected = selectedRows.has(rowId)
                
                return (
                  <TableRow
                    key={rowId}
                    selected={isSelected}
                    clickable={!!onRowClick}
                    onClick={() => onRowClick?.(row, index)}
                    className={cn(
                      onRowClick && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {/* Row selection checkbox */}
                    {selectable && (
                      <TableCell size={size}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleRowSelect(row, e.target.checked)
                          }}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    
                    {/* Data cells */}
                    {columns.map((column) => (
                      <TableCell
                        key={`${rowId}-${column.id}`}
                        align={column.align}
                        size={size}
                        className={cn(column.className)}
                      >
                        {getCellValue(row, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </table>
      </div>
    )
  }
)
Table.displayName = 'Table'

/**
 * Table header component
 */
const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, children, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants({ sticky }), className)}
      {...props}
    >
      {children}
    </thead>
  )
)
TableHeader.displayName = 'TableHeader'

/**
 * Table body component
 */
const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('divide-y divide-gray-100 dark:divide-gray-800', className)}
      {...props}
    >
      {children}
    </tbody>
  )
)
TableBody.displayName = 'TableBody'

/**
 * Table row component
 */
const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, clickable, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ selected, clickable }), className)}
      {...props}
    >
      {children}
    </tr>
  )
)
TableRow.displayName = 'TableRow'

/**
 * Table cell component
 */
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, size, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(tableCellVariants({ align, size }), className)}
      {...props}
    >
      {children}
    </td>
  )
)
TableCell.displayName = 'TableCell'

/**
 * Table header cell component
 */
const TableHeaderCell = React.forwardRef<HTMLTableHeaderCellElement, TableHeaderCellProps>(
  ({ className, sortable, sorted, children, onSort, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(tableHeaderCellVariants({ sortable, sorted }), className)}
      role={sortable ? 'columnheader button' : 'columnheader'}
      tabIndex={sortable ? 0 : undefined}
      onKeyDown={sortable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort?.()
        }
      } : undefined}
      aria-sort={
        sorted === 'asc' ? 'ascending' :
        sorted === 'desc' ? 'descending' :
        sortable ? 'none' : undefined
      }
      {...props}
    >
      {children}
    </th>
  )
)
TableHeaderCell.displayName = 'TableHeaderCell'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  tableVariants,
  tableHeaderVariants,
  tableRowVariants,
  tableCellVariants,
  tableHeaderCellVariants,
}

export type {
  TableProps,
  TableColumn,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableHeaderCellProps,
}