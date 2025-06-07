/**
 * Roles Management Client Component for React/Next.js Migration
 * 
 * Client-side interactive component that handles role management operations
 * including table interactions, data fetching, and CRUD operations.
 * Separates interactive functionality from server component for optimal
 * performance per Next.js 15.1 SSR requirements.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useRoles,
  useDeleteRole,
  useBulkRoleOperation,
  mapRolesToTableRows,
} from '@/hooks/use-roles'
import { Table, TableColumn } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RoleRow,
  RoleType,
  RoleListParams,
  RoleBulkOperation,
} from '@/types/role'
import { cn } from '@/lib/utils'

// =============================================================================
// ICONS
// =============================================================================

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Roles page toolbar with search and actions
 */
const RolesToolbar: React.FC<{
  searchValue: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  selectedCount: number
  onBulkDelete: () => void
  onBulkActivate: () => void
  onBulkDeactivate: () => void
}> = ({
  searchValue,
  onSearchChange,
  onRefresh,
  selectedCount,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    {/* Page Header */}
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <ShieldIcon />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Role Management
        </h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Manage user roles and permissions for API access control
      </p>
    </div>

    {/* Actions */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
          placeholder="Search roles..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search roles"
        />
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkActivate}
          >
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDeactivate}
          >
            Deactivate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
          >
            Delete
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          leftIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
        <Link href="/api-security/roles/create">
          <Button
            variant="default"
            size="sm"
            leftIcon={<PlusIcon />}
          >
            Create Role
          </Button>
        </Link>
      </div>
    </div>
  </div>
)

/**
 * Role actions cell component
 */
const RoleActionsCell: React.FC<{
  role: RoleRow
  onEdit: (role: RoleRow) => void
  onDelete: (role: RoleRow) => void
}> = ({ role, onEdit, onDelete }) => (
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onEdit(role)
      }}
      leftIcon={<EditIcon />}
      aria-label={`Edit role ${role.name}`}
    >
      Edit
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onDelete(role)
      }}
      leftIcon={<DeleteIcon />}
      aria-label={`Delete role ${role.name}`}
    >
      Delete
    </Button>
  </div>
)

/**
 * Role status badge component
 */
const RoleStatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <Badge
    variant={active ? 'success' : 'secondary'}
    size="sm"
  >
    {active ? 'Active' : 'Inactive'}
  </Badge>
)

/**
 * Confirmation dialog component
 */
const ConfirmDialog: React.FC<{
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
}> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

/**
 * Main roles page client component with interactive functionality
 */
export function RolesPageClient() {
  const router = useRouter()
  
  // State management
  const [searchValue, setSearchValue] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc',
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    role?: RoleRow
    type: 'single' | 'bulk'
  }>({ open: false, type: 'single' })

  // Query parameters
  const queryParams = useMemo<RoleListParams>(() => ({
    limit: 25,
    offset: 0,
    search: searchValue || undefined,
    sort: sortBy.column,
    order: sortBy.direction,
    includeInactive: true,
  }), [searchValue, sortBy])

  // Data fetching with React Query
  const {
    data: rolesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useRoles(queryParams, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Mutations
  const deleteRoleMutation = useDeleteRole()
  const bulkOperationMutation = useBulkRoleOperation()

  // Transform data for table
  const tableData = useMemo(() => {
    if (!rolesResponse?.resource) return []
    return mapRolesToTableRows(rolesResponse.resource)
  }, [rolesResponse])

  // Table columns configuration
  const columns = useMemo<TableColumn<RoleRow>[]>(() => [
    {
      id: 'active',
      header: 'Status',
      accessor: 'active',
      sortable: true,
      width: '100px',
      cell: (value: boolean) => <RoleStatusBadge active={value} />,
    },
    {
      id: 'name',
      header: 'Role Name',
      accessor: 'name',
      sortable: true,
      cell: (value: string) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {value}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessor: 'description',
      sortable: true,
      cell: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '150px',
      cell: (_, row: RoleRow) => (
        <RoleActionsCell
          role={row}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
        />
      ),
    },
  ], [])

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortBy({ column, direction })
  }

  const handleRowSelect = (row: RoleRow, selected: boolean) => {
    const newSelection = new Set(selectedRows)
    if (selected) {
      newSelection.add(row.id)
    } else {
      newSelection.delete(row.id)
    }
    setSelectedRows(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(tableData.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleRowClick = (row: RoleRow) => {
    router.push(`/api-security/roles/${row.id}`)
  }

  const handleEditRole = (role: RoleRow) => {
    router.push(`/api-security/roles/${role.id}`)
  }

  const handleDeleteRole = (role: RoleRow) => {
    setDeleteDialog({
      open: true,
      role,
      type: 'single',
    })
  }

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return
    setDeleteDialog({
      open: true,
      type: 'bulk',
    })
  }

  const handleBulkActivate = () => {
    if (selectedRows.size === 0) return
    
    const operation: RoleBulkOperation = {
      operation: 'activate',
      roleIds: Array.from(selectedRows),
    }
    
    bulkOperationMutation.mutate(operation, {
      onSuccess: () => {
        setSelectedRows(new Set())
        refetch()
      },
    })
  }

  const handleBulkDeactivate = () => {
    if (selectedRows.size === 0) return
    
    const operation: RoleBulkOperation = {
      operation: 'deactivate',
      roleIds: Array.from(selectedRows),
    }
    
    bulkOperationMutation.mutate(operation, {
      onSuccess: () => {
        setSelectedRows(new Set())
        refetch()
      },
    })
  }

  const confirmDelete = () => {
    if (deleteDialog.type === 'single' && deleteDialog.role) {
      deleteRoleMutation.mutate(deleteDialog.role.id, {
        onSuccess: () => {
          setDeleteDialog({ open: false, type: 'single' })
          refetch()
        },
      })
    } else if (deleteDialog.type === 'bulk') {
      const operation: RoleBulkOperation = {
        operation: 'delete',
        roleIds: Array.from(selectedRows),
      }
      
      bulkOperationMutation.mutate(operation, {
        onSuccess: () => {
          setDeleteDialog({ open: false, type: 'bulk' })
          setSelectedRows(new Set())
          refetch()
        },
      })
    }
  }

  const cancelDelete = () => {
    setDeleteDialog({ open: false, type: 'single' })
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8" data-testid="roles-error">
        <ShieldIcon />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Roles
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {error instanceof Error ? error.message : 'An error occurred while loading roles.'}
        </p>
        <Button onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" data-testid="roles-page">
      {/* Toolbar */}
      <RolesToolbar
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        selectedCount={selectedRows.size}
        onBulkDelete={handleBulkDelete}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
      />

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-white dark:bg-gray-800 shadow-sm">
          <Table
            data={tableData}
            columns={columns}
            loading={isLoading}
            selectable
            selectedRows={selectedRows}
            onRowSelect={handleRowSelect}
            onSelectAll={handleSelectAll}
            onRowClick={handleRowClick}
            sortBy={sortBy}
            onSort={handleSort}
            emptyMessage="No roles found. Create your first role to get started."
            stickyHeader
            className="h-full"
          />
        </div>
      </div>

      {/* Pagination Footer */}
      {rolesResponse?.meta && rolesResponse.meta.count > 25 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {rolesResponse.resource.length} of {rolesResponse.meta.count} roles
            </div>
            {/* Pagination controls would be implemented here */}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title={
          deleteDialog.type === 'single'
            ? 'Delete Role'
            : `Delete ${selectedRows.size} Roles`
        }
        message={
          deleteDialog.type === 'single'
            ? `Are you sure you want to delete the role "${deleteDialog.role?.name}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedRows.size} selected roles? This action cannot be undone.`
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}