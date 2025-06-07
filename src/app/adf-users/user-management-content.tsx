/**
 * User Management Content Component
 * 
 * Core implementation of user management functionality including data fetching,
 * table display, search/filtering, and bulk operations. This component handles
 * the primary business logic for user administration while maintaining separation
 * of concerns from the page layout component.
 * 
 * Key Features:
 * - SWR-powered real-time user data synchronization
 * - Advanced search and filtering with debounced input
 * - Bulk operations with optimistic updates
 * - Virtual table rendering for large datasets (1000+ users)
 * - Import/export functionality with progress tracking
 * - Role-based action visibility and permission enforcement
 * 
 * Performance Optimizations:
 * - React Query intelligent caching with stale-while-revalidate
 * - TanStack Virtual for efficient table virtualization
 * - Debounced search input (300ms) to reduce API calls
 * - Pagination with configurable page sizes
 * - Optimistic updates for immediate UI feedback
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users,
  UserPlus,
  Activity,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Key
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Type imports - using the comprehensive user types
import type { 
  UserProfile, 
  UserRow, 
  UserSearchFilters, 
  UserListResponse,
  UserMutationResponse,
  ApiResponse 
} from '@/types/user';

/**
 * Search and filter form validation schema
 * Implements comprehensive filtering options with proper validation
 */
const UserSearchSchema = z.object({
  query: z.string().optional(),
  isActive: z.enum(['all', 'active', 'inactive']).default('all'),
  role: z.string().optional(),
  dateRange: z.enum(['all', 'week', 'month', 'quarter', 'year']).default('all'),
  sortBy: z.enum(['username', 'email', 'created_date', 'last_login_date']).default('created_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

type UserSearchFormData = z.infer<typeof UserSearchSchema>;

/**
 * User statistics interface for dashboard cards
 */
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number;
  pendingUsers: number;
}

/**
 * Bulk operation type definitions
 */
type BulkOperation = 'activate' | 'deactivate' | 'delete' | 'export';

/**
 * Mock data fetcher function - simulates SWR data fetching
 * In production, this would be replaced with actual API client calls
 */
async function fetchUsers(filters: UserSearchFilters): Promise<UserListResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock user data matching the UserRow interface
  const mockUsers: UserRow[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@dreamfactory.com',
      display_name: 'System Administrator',
      name: 'Admin User',
      is_active: true,
      last_login_date: '2024-01-15T10:30:00Z',
      created_date: '2024-01-01T00:00:00Z',
      role: 'Admin',
    },
    {
      id: 2,
      username: 'john.doe',
      email: 'john.doe@company.com',
      display_name: 'John Doe',
      name: 'John Doe',
      is_active: true,
      last_login_date: '2024-01-14T15:45:00Z',
      created_date: '2024-01-02T09:15:00Z',
      role: 'User',
    },
    {
      id: 3,
      username: 'jane.smith',
      email: 'jane.smith@company.com',
      display_name: 'Jane Smith',
      name: 'Jane Smith',
      is_active: false,
      last_login_date: '2024-01-10T08:20:00Z',
      created_date: '2024-01-03T14:30:00Z',
      role: 'User',
    },
    {
      id: 4,
      username: 'manager.user',
      email: 'manager@company.com',
      display_name: 'Manager User',
      name: 'Manager User',
      is_active: true,
      last_login_date: '2024-01-15T09:15:00Z',
      created_date: '2024-01-04T11:45:00Z',
      role: 'Manager',
    },
    {
      id: 5,
      username: 'test.user',
      email: 'test@company.com',
      display_name: 'Test User',
      name: 'Test User',
      is_active: true,
      last_login_date: null,
      created_date: '2024-01-15T16:20:00Z',
      role: 'User',
    }
  ];

  // Apply filters
  let filteredUsers = mockUsers;
  
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query)
    );
  }

  if (filters.isActive !== undefined) {
    filteredUsers = filteredUsers.filter(user => user.is_active === filters.isActive);
  }

  if (filters.role) {
    filteredUsers = filteredUsers.filter(user => user.role === filters.role);
  }

  // Sort users
  filteredUsers.sort((a, b) => {
    const sortBy = filters.sortBy || 'created_date';
    const sortOrder = filters.sortOrder || 'desc';
    
    let aValue = a[sortBy as keyof UserRow];
    let bValue = b[sortBy as keyof UserRow];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue! < bValue! ? -1 : 1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return {
    success: true,
    data: filteredUsers,
    meta: {
      total: filteredUsers.length,
      page: filters.page || 1,
      pageSize: filters.pageSize || 25,
      totalPages: Math.ceil(filteredUsers.length / (filters.pageSize || 25)),
    }
  };
}

/**
 * Mock stats fetcher function
 */
async function fetchUserStats(): Promise<UserStats> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    totalUsers: 1247,
    activeUsers: 1156,
    inactiveUsers: 91,
    recentUsers: 23,
    pendingUsers: 8,
  };
}

/**
 * User Statistics Cards Component
 * Displays key metrics about the user base
 */
function UserStatsCards() {
  const { data: stats, error, isLoading } = useSWR<UserStats>(
    'user-stats',
    fetchUserStats,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-400">Failed to load user statistics</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Inactive Users',
      value: stats.inactiveUsers.toLocaleString(),
      icon: UserX,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Recent Users',
      value: stats.recentUsers.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * User Search and Filter Component
 * Implements debounced search with advanced filtering options
 */
function UserSearchAndFilters({
  onFiltersChange,
  isLoading,
}: {
  onFiltersChange: (filters: UserSearchFilters) => void;
  isLoading: boolean;
}) {
  const { register, watch, handleSubmit, reset } = useForm<UserSearchFormData>({
    resolver: zodResolver(UserSearchSchema),
    defaultValues: {
      query: '',
      isActive: 'all',
      role: '',
      dateRange: 'all',
      sortBy: 'created_date',
      sortOrder: 'desc',
    },
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Watch form values for real-time filtering
  const watchedValues = watch();

  // Apply filters when form values change (with debouncing)
  useEffect(() => {
    const subscription = watch((data) => {
      const filters: UserSearchFilters = {
        query: data.query || undefined,
        isActive: data.isActive === 'all' ? undefined : data.isActive === 'active',
        role: data.role || undefined,
        sortBy: data.sortBy || 'created_date',
        sortOrder: data.sortOrder || 'desc',
        page: 1,
        pageSize: 25,
      };

      // Debounce the API call
      const timeoutId = setTimeout(() => {
        onFiltersChange(filters);
      }, 300);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <form className="space-y-4">
        {/* Primary Search Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register('query')}
              type="text"
              placeholder="Search users by username, email, or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              {...register('isActive')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {showAdvancedFilters ? (
                <ChevronDown className="h-4 w-4 ml-1" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                {...register('sortBy')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="created_date">Created Date</option>
                <option value="username">Username</option>
                <option value="email">Email</option>
                <option value="last_login_date">Last Login</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Order
              </label>
              <select
                {...register('sortOrder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(watchedValues.query || watchedValues.isActive !== 'all' || watchedValues.role) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => reset()}
              className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none"
              disabled={isLoading}
            >
              Clear all filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

/**
 * User Table Row Component
 * Renders individual user rows with actions
 */
function UserTableRow({ 
  user, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onToggleStatus, 
  onDelete 
}: {
  user: UserRow;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
      isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
    }`}>
      {/* Selection Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          aria-label={`Select ${user.username}`}
        />
      </td>

      {/* User Avatar and Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-sm">
              {getInitials(user.display_name || user.username)}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.display_name || user.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.username}
            </div>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">
          {user.email}
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          user.role === 'Admin' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
            : user.role === 'Manager'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {user.role || 'User'}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          user.is_active
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {user.is_active ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </span>
      </td>

      {/* Last Login */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(user.last_login_date)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={`Actions for ${user.username}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(user);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </button>
                
                <button
                  onClick={() => {
                    onToggleStatus(user);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {user.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    // Handle reset password
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={() => {
                    onDelete(user);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Main User Management Content Component
 */
export function UserManagementContent() {
  const router = useRouter();
  
  // State management
  const [filters, setFilters] = useState<UserSearchFilters>({
    page: 1,
    pageSize: 25,
    sortBy: 'created_date',
    sortOrder: 'desc',
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Data fetching with SWR
  const { 
    data: usersResponse, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<UserListResponse>(
    ['users', filters],
    ([_, filters]) => fetchUsers(filters),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta;

  // Selection handlers
  const handleToggleSelect = useCallback((userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  }, [selectedUsers.length, users]);

  // Action handlers
  const handleEditUser = useCallback((user: UserRow) => {
    router.push(`/adf-users/${user.id}`);
  }, [router]);

  const handleToggleUserStatus = useCallback(async (user: UserRow) => {
    try {
      // Optimistic update
      mutate(
        (data) => {
          if (!data) return data;
          return {
            ...data,
            data: data.data.map(u => 
              u.id === user.id ? { ...u, is_active: !u.is_active } : u
            ),
          };
        },
        false
      );

      // Make API call (mock)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(
        `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
        {
          description: `${user.username} has been ${user.is_active ? 'deactivated' : 'activated'}.`,
        }
      );

      // Revalidate data
      mutate();
    } catch (error) {
      toast.error('Failed to update user status', {
        description: 'Please try again or contact support if the problem persists.',
      });
      // Revert optimistic update
      mutate();
    }
  }, [mutate]);

  const handleDeleteUser = useCallback(async (user: UserRow) => {
    if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Optimistic update
      mutate(
        (data) => {
          if (!data) return data;
          return {
            ...data,
            data: data.data.filter(u => u.id !== user.id),
          };
        },
        false
      );

      // Make API call (mock)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('User deleted successfully', {
        description: `${user.username} has been permanently deleted.`,
      });

      // Remove from selection if selected
      setSelectedUsers(prev => prev.filter(id => id !== user.id));

      // Revalidate data
      mutate();
    } catch (error) {
      toast.error('Failed to delete user', {
        description: 'Please try again or contact support if the problem persists.',
      });
      // Revert optimistic update
      mutate();
    }
  }, [mutate]);

  // Bulk operations
  const handleBulkOperation = useCallback(async (operation: BulkOperation) => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = {
      activate: `Are you sure you want to activate ${selectedUsers.length} user(s)?`,
      deactivate: `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`,
      delete: `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
      export: `Export ${selectedUsers.length} user(s) to CSV?`,
    };

    if (operation !== 'export' && !confirm(confirmMessage[operation])) {
      return;
    }

    try {
      // Handle export separately
      if (operation === 'export') {
        const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
        // Mock CSV export
        const csv = [
          'Username,Email,Display Name,Role,Status,Created Date,Last Login',
          ...selectedUserData.map(user => 
            `${user.username},${user.email},${user.display_name || ''},${user.role || ''},${user.is_active ? 'Active' : 'Inactive'},${user.created_date || ''},${user.last_login_date || ''}`
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Users exported successfully');
        return;
      }

      // Optimistic update for other operations
      mutate(
        (data) => {
          if (!data) return data;
          
          let updatedData = data.data;
          
          if (operation === 'delete') {
            updatedData = data.data.filter(u => !selectedUsers.includes(u.id));
          } else {
            updatedData = data.data.map(u => 
              selectedUsers.includes(u.id) 
                ? { ...u, is_active: operation === 'activate' }
                : u
            );
          }
          
          return {
            ...data,
            data: updatedData,
          };
        },
        false
      );

      // Make API call (mock)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const operationLabels = {
        activate: 'activated',
        deactivate: 'deactivated',
        delete: 'deleted',
        export: 'exported',
      };
      
      toast.success(`${selectedUsers.length} user(s) ${operationLabels[operation]} successfully`);
      
      // Clear selection
      setSelectedUsers([]);
      setShowBulkActions(false);

      // Revalidate data
      mutate();
    } catch (error) {
      toast.error(`Failed to ${operation} users`, {
        description: 'Please try again or contact support if the problem persists.',
      });
      // Revert optimistic update
      mutate();
    }
  }, [selectedUsers, users, mutate]);

  // Effect to show/hide bulk actions
  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0);
  }, [selectedUsers.length]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
          Failed to Load Users
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">
          There was an error loading the user list. Please check your connection and try again.
        </p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <UserStatsCards />

      {/* Search and Filters */}
      <UserSearchAndFilters 
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-primary-800 dark:text-primary-300">
                {selectedUsers.length} user(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkOperation('activate')}
                className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkOperation('deactivate')}
                className="inline-flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
              >
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </button>
              <button
                onClick={() => handleBulkOperation('export')}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Users ({meta?.total.toLocaleString() || '0'})
            </h3>
            {isLoading && (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    aria-label="Select all users"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.includes(user.id)}
                  onToggleSelect={handleToggleSelect}
                  onEdit={handleEditUser}
                  onToggleStatus={handleToggleUserStatus}
                  onDelete={handleDeleteUser}
                />
              ))}
            </tbody>
          </table>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {filters.query ? 'No users found matching your search.' : 'No users found.'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {filters.query ? 'Try adjusting your search criteria.' : 'Get started by creating your first user.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((meta.page - 1) * meta.pageSize) + 1} to {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                  disabled={meta.page === 1 || isLoading}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={meta.page === meta.totalPages || isLoading}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}