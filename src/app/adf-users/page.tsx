/**
 * User Management Page Component
 * 
 * Main user management interface implementing user list display, import/export functionality,
 * and comprehensive CRUD operations. Converts Angular df-manage-users component to Next.js
 * with React Hook Form integration, SWR-powered data fetching, and Tailwind CSS responsive design.
 * 
 * @version React 19.0.0 + Next.js 15.1.0
 * @author DreamFactory Team
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { 
  Users, 
  UserPlus, 
  Download, 
  Upload, 
  Filter,
  Search,
  MoreVertical,
  Settings,
  Trash2,
  Edit3,
  Shield,
  Activity
} from 'lucide-react';

// Type imports for comprehensive user management
import type { 
  UserProfile, 
  UsersListResponse,
  UserRegistrationForm,
  UserProfileUpdateForm,
  UserPermissions
} from '@/types/user';

// Component imports for modular architecture  
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorMessage } from '@/components/ui/error-message';

// Specialized user management components
import { UserTable } from '@/components/users/user-table';
import { UserImportExport } from '@/components/users/user-import-export';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { UserPermissionsDialog } from '@/components/users/user-permissions-dialog';
import { UserBulkActions } from '@/components/users/user-bulk-actions';
import { UserMetrics } from '@/components/users/user-metrics';
import { UserFilters } from '@/components/users/user-filters';

// Custom hooks for data management and state
import { useUsers } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDebounce } from '@/hooks/use-debounce';

// Utility imports
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { downloadFile } from '@/lib/file-utils';

/**
 * Next.js metadata configuration for SEO optimization
 */
export const metadata: Metadata = {
  title: 'User Management',
  description: 'Manage application users, roles, and permissions with comprehensive CRUD operations and import/export capabilities',
  openGraph: {
    title: 'User Management | DreamFactory Admin Console',
    description: 'Centralized user administration with role-based access control and bulk operations',
    type: 'website',
  },
  keywords: ['user management', 'RBAC', 'user administration', 'permissions', 'roles'],
};

/**
 * Force dynamic rendering for real-time user data
 */
export const dynamic = 'force-dynamic';

/**
 * User management interface state types
 */
interface UserManagementState {
  selectedUsers: Set<number>;
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  roleFilter: 'all' | string;
  sortField: keyof UserProfile;
  sortDirection: 'asc' | 'desc';
  showCreateDialog: boolean;
  showEditDialog: boolean;
  showPermissionsDialog: boolean;
  showImportDialog: boolean;
  showDeleteDialog: boolean;
  editingUser: UserProfile | null;
  page: number;
  pageSize: number;
}

/**
 * Initial state configuration
 */
const initialState: UserManagementState = {
  selectedUsers: new Set(),
  searchQuery: '',
  statusFilter: 'all',
  roleFilter: 'all',
  sortField: 'last_modified_date',
  sortDirection: 'desc',
  showCreateDialog: false,
  showEditDialog: false,
  showPermissionsDialog: false,
  showImportDialog: false,
  showDeleteDialog: false,
  editingUser: null,
  page: 1,
  pageSize: 25,
};

/**
 * Main User Management Page Component
 * 
 * Implements comprehensive user administration interface with:
 * - Real-time user list with pagination and sorting
 * - Advanced filtering and search capabilities
 * - Bulk operations for multiple user management
 * - Import/export functionality for user data
 * - Inline editing and permission management
 * - Role-based access control enforcement
 * - Responsive design with accessibility features
 */
export default function UserManagementPage() {
  // Authentication context for permission checks
  const { user: currentUser, permissions } = useAuth();
  
  // Persistent UI state management
  const [uiState, setUiState] = useLocalStorage<UserManagementState>(
    'user-management-state',
    initialState
  );

  // Debounced search for optimal performance
  const debouncedSearchQuery = useDebounce(uiState.searchQuery, 300);

  // SWR-powered data fetching with intelligent caching
  const {
    users,
    totalUsers,
    isLoading,
    isError,
    error,
    mutate,
    createUser,
    updateUser,
    deleteUser,
    deleteUsers,
    exportUsers,
    importUsers,
    isCreating,
    isUpdating,
    isDeleting,
    isExporting,
    isImporting,
  } = useUsers({
    search: debouncedSearchQuery,
    status: uiState.statusFilter,
    role: uiState.roleFilter,
    sortBy: uiState.sortField,
    sortDirection: uiState.sortDirection,
    page: uiState.page,
    limit: uiState.pageSize,
  });

  /**
   * Permission validation for user management operations
   */
  const canCreateUsers = permissions?.canManageUsers || permissions?.isSystemAdmin;
  const canEditUsers = permissions?.canManageUsers || permissions?.isSystemAdmin;
  const canDeleteUsers = permissions?.canManageUsers || permissions?.isSystemAdmin;
  const canManagePermissions = permissions?.canManageRoles || permissions?.isSystemAdmin;
  const canImportExport = permissions?.canManageUsers || permissions?.isSystemAdmin;

  /**
   * Update UI state helper
   */
  const updateUiState = (updates: Partial<UserManagementState>) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Handle user selection for bulk operations
   */
  const handleUserSelection = (userId: number, selected: boolean) => {
    const newSelection = new Set(uiState.selectedUsers);
    if (selected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    updateUiState({ selectedUsers: newSelection });
  };

  /**
   * Handle select all users
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allUserIds = new Set(users?.map(user => user.id) || []);
      updateUiState({ selectedUsers: allUserIds });
    } else {
      updateUiState({ selectedUsers: new Set() });
    }
  };

  /**
   * Handle search input with debouncing
   */
  const handleSearch = (query: string) => {
    updateUiState({ 
      searchQuery: query,
      page: 1 // Reset to first page on search
    });
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (
    filterType: 'status' | 'role',
    value: string
  ) => {
    updateUiState({
      [filterType === 'status' ? 'statusFilter' : 'roleFilter']: value,
      page: 1 // Reset to first page on filter change
    });
  };

  /**
   * Handle sorting changes
   */
  const handleSort = (field: keyof UserProfile) => {
    const newDirection = 
      uiState.sortField === field && uiState.sortDirection === 'asc' 
        ? 'desc' 
        : 'asc';
    
    updateUiState({
      sortField: field,
      sortDirection: newDirection,
      page: 1 // Reset to first page on sort change
    });
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    updateUiState({ page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateUiState({ 
      pageSize,
      page: 1 // Reset to first page on page size change
    });
  };

  /**
   * Handle user creation
   */
  const handleCreateUser = async (userData: UserRegistrationForm) => {
    try {
      await createUser(userData);
      updateUiState({ showCreateDialog: false });
      // Optimistically update the list
      await mutate();
    } catch (error) {
      console.error('Failed to create user:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle user updates
   */
  const handleUpdateUser = async (
    userId: number, 
    userData: UserProfileUpdateForm
  ) => {
    try {
      await updateUser(userId, userData);
      updateUiState({ 
        showEditDialog: false,
        editingUser: null 
      });
      // Optimistically update the list
      await mutate();
    } catch (error) {
      console.error('Failed to update user:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle user deletion
   */
  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      updateUiState({ showDeleteDialog: false });
      // Remove from selection if selected
      const newSelection = new Set(uiState.selectedUsers);
      newSelection.delete(userId);
      updateUiState({ selectedUsers: newSelection });
      // Optimistically update the list
      await mutate();
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle bulk user deletion
   */
  const handleBulkDelete = async () => {
    try {
      const userIds = Array.from(uiState.selectedUsers);
      await deleteUsers(userIds);
      updateUiState({ 
        selectedUsers: new Set(),
        showDeleteDialog: false 
      });
      // Optimistically update the list
      await mutate();
    } catch (error) {
      console.error('Failed to delete users:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle user data export
   */
  const handleExportUsers = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const selectedIds = Array.from(uiState.selectedUsers);
      const exportData = await exportUsers(
        selectedIds.length > 0 ? selectedIds : undefined,
        format
      );
      
      // Download the exported file
      const filename = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
      downloadFile(exportData, filename, format === 'csv' ? 'text/csv' : 'application/json');
    } catch (error) {
      console.error('Failed to export users:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle user data import
   */
  const handleImportUsers = async (file: File) => {
    try {
      await importUsers(file);
      updateUiState({ showImportDialog: false });
      // Refresh the user list
      await mutate();
    } catch (error) {
      console.error('Failed to import users:', error);
      // Error handling is managed by the hook
    }
  };

  /**
   * Handle user editing initiation
   */
  const handleEditUser = (user: UserProfile) => {
    updateUiState({
      editingUser: user,
      showEditDialog: true
    });
  };

  /**
   * Handle permission management initiation
   */
  const handleManagePermissions = (user: UserProfile) => {
    updateUiState({
      editingUser: user,
      showPermissionsDialog: true
    });
  };

  /**
   * Calculate user statistics for metrics display
   */
  const userStats = {
    total: totalUsers || 0,
    active: users?.filter(user => user.is_active).length || 0,
    inactive: users?.filter(user => !user.is_active).length || 0,
    admins: users?.filter(user => user.is_sys_admin).length || 0,
    selected: uiState.selectedUsers.size,
  };

  // Render loading state
  if (isLoading && !users) {
    return (
      <div className="space-y-6" data-testid="user-management-loading">
        <LoadingSkeleton className="h-20" />
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  // Render error state
  if (isError && !users) {
    return (
      <div className="space-y-6" data-testid="user-management-error">
        <PageHeader
          title="User Management"
          description="Manage application users, roles, and permissions"
        />
        <ErrorMessage
          title="Failed to Load Users"
          message={error?.message || 'Unable to load user data. Please try again.'}
          action={
            <Button onClick={() => mutate()} variant="outline">
              Retry Loading
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-page">
      {/* Page Header with Actions */}
      <PageHeader
        title="User Management"
        description="Manage application users, roles, and permissions"
        action={
          <div className="flex items-center gap-3">
            {/* Import/Export Actions */}
            {canImportExport && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUiState({ showImportDialog: true })}
                  disabled={isImporting}
                  className="hidden sm:inline-flex"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportUsers('csv')}
                  disabled={isExporting}
                  className="hidden sm:inline-flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            )}

            {/* Create User Button */}
            {canCreateUsers && (
              <Button
                onClick={() => updateUiState({ showCreateDialog: true })}
                disabled={isCreating}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        }
      />

      {/* User Metrics Dashboard */}
      <Suspense fallback={<LoadingSkeleton className="h-24" />}>
        <UserMetrics stats={userStats} />
      </Suspense>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or username..."
              value={uiState.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={uiState.statusFilter}
            onValueChange={(value) => handleFilterChange('status', value)}
            placeholder="All Statuses"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          {/* Role Filter */}
          <Select
            value={uiState.roleFilter}
            onValueChange={(value) => handleFilterChange('role', value)}
            placeholder="All Roles"
          >
            <option value="all">All Roles</option>
            <option value="admin">System Admin</option>
            <option value="user">Regular User</option>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {uiState.selectedUsers.size > 0 && (
        <UserBulkActions
          selectedCount={uiState.selectedUsers.size}
          onDelete={handleBulkDelete}
          onExport={() => handleExportUsers('csv')}
          onClearSelection={() => updateUiState({ selectedUsers: new Set() })}
          disabled={isDeleting || isExporting}
          canDelete={canDeleteUsers}
          canExport={canImportExport}
        />
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <UserTable
            users={users || []}
            selectedUsers={uiState.selectedUsers}
            sortField={uiState.sortField}
            sortDirection={uiState.sortDirection}
            onSort={handleSort}
            onSelectUser={handleUserSelection}
            onSelectAll={handleSelectAll}
            onEditUser={handleEditUser}
            onDeleteUser={(user) => {
              updateUiState({ 
                editingUser: user,
                showDeleteDialog: true 
              });
            }}
            onManagePermissions={handleManagePermissions}
            isLoading={isLoading}
            canEdit={canEditUsers}
            canDelete={canDeleteUsers}
            canManagePermissions={canManagePermissions}
            currentUserId={currentUser?.id}
          />
        </Suspense>

        {/* Pagination */}
        {users && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((uiState.page - 1) * uiState.pageSize) + 1} to{' '}
                {Math.min(uiState.page * uiState.pageSize, totalUsers || 0)} of{' '}
                {totalUsers || 0} users
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={uiState.pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(uiState.page - 1)}
                    disabled={uiState.page <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(uiState.page + 1)}
                    disabled={
                      uiState.page >= Math.ceil((totalUsers || 0) / uiState.pageSize) ||
                      isLoading
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {users && users.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {uiState.searchQuery || uiState.statusFilter !== 'all' || uiState.roleFilter !== 'all'
              ? 'No users match your filters'
              : 'No users found'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {uiState.searchQuery || uiState.statusFilter !== 'all' || uiState.roleFilter !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : canCreateUsers
                ? 'Get started by creating a new user account.'
                : 'Contact your administrator to create user accounts.'
            }
          </p>
          {canCreateUsers && (
            <div className="mt-6">
              <Button
                onClick={() => updateUiState({ showCreateDialog: true })}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create First User
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create User Dialog */}
      {uiState.showCreateDialog && (
        <UserFormDialog
          isOpen={true}
          onClose={() => updateUiState({ showCreateDialog: false })}
          onSubmit={handleCreateUser}
          title="Create New User"
          submitLabel="Create User"
          isSubmitting={isCreating}
        />
      )}

      {/* Edit User Dialog */}
      {uiState.showEditDialog && uiState.editingUser && (
        <UserFormDialog
          isOpen={true}
          onClose={() => updateUiState({ 
            showEditDialog: false,
            editingUser: null 
          })}
          onSubmit={(data) => handleUpdateUser(uiState.editingUser!.id, data)}
          title="Edit User"
          submitLabel="Update User"
          initialData={uiState.editingUser}
          isSubmitting={isUpdating}
        />
      )}

      {/* User Permissions Dialog */}
      {uiState.showPermissionsDialog && uiState.editingUser && (
        <UserPermissionsDialog
          isOpen={true}
          onClose={() => updateUiState({ 
            showPermissionsDialog: false,
            editingUser: null 
          })}
          user={uiState.editingUser}
          onPermissionsUpdated={() => mutate()}
        />
      )}

      {/* Import Users Dialog */}
      {uiState.showImportDialog && (
        <UserImportExport
          isOpen={true}
          onClose={() => updateUiState({ showImportDialog: false })}
          onImport={handleImportUsers}
          onExport={handleExportUsers}
          isImporting={isImporting}
          isExporting={isExporting}
          mode="import"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {uiState.showDeleteDialog && (
        <Dialog
          isOpen={true}
          onClose={() => updateUiState({ showDeleteDialog: false })}
          title="Confirm Deletion"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {uiState.selectedUsers.size > 1
                    ? `Delete ${uiState.selectedUsers.size} users?`
                    : `Delete ${uiState.editingUser?.name || 'this user'}?`
                  }
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {uiState.selectedUsers.size > 1
                    ? 'This action will permanently delete all selected users and cannot be undone.'
                    : 'This action will permanently delete this user account and cannot be undone.'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => updateUiState({ showDeleteDialog: false })}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={
                  uiState.selectedUsers.size > 1
                    ? handleBulkDelete
                    : () => handleDeleteUser(uiState.editingUser!.id)
                }
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {uiState.selectedUsers.size > 1 ? 'Users' : 'User'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}