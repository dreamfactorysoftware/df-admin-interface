'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrashIcon, 
  PencilIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useNotifications } from '@/hooks/use-notifications';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

// Types for email templates
interface EmailTemplate {
  id: string;
  name: string;
  to: string;
  from: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  defaults?: string;
  description?: string;
  created_date: string;
  last_modified_date: string;
  created_by_id?: string;
  last_modified_by_id?: string;
}

interface ApiResponse<T> {
  resource: T[];
  meta?: {
    count: number;
    offset: number;
    limit: number;
  };
}

interface TableFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

interface TableColumn {
  key: keyof EmailTemplate | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface EmailTemplateTableProps {
  className?: string;
  onTemplateEdit?: (template: EmailTemplate) => void;
  onTemplateView?: (template: EmailTemplate) => void;
  onTemplateDuplicate?: (template: EmailTemplate) => void;
  onTemplateDelete?: (template: EmailTemplate) => void;
}

// Mock API client - will be replaced by actual implementation
const emailTemplatesApi = {
  getEmailTemplates: async (filters: TableFilters): Promise<ApiResponse<EmailTemplate>> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock data for development
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Welcome Email',
        to: '{email}',
        from: 'noreply@dreamfactory.com',
        subject: 'Welcome to DreamFactory',
        body_text: 'Welcome to our platform!',
        body_html: '<h1>Welcome to our platform!</h1>',
        description: 'Welcome email for new users',
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Password Reset',
        to: '{email}',
        from: 'noreply@dreamfactory.com',
        subject: 'Password Reset Request',
        body_text: 'Click to reset your password',
        body_html: '<p>Click to reset your password</p>',
        description: 'Password reset email template',
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
      },
    ];

    // Apply search filter
    let filtered = mockTemplates;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = mockTemplates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.subject.toLowerCase().includes(searchLower) ||
        (template.description && template.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof EmailTemplate] || '';
        const bValue = b[filters.sortBy as keyof EmailTemplate] || '';
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const total = filtered.length;
    const paginatedTemplates = filtered.slice(filters.offset, filters.offset + filters.limit);

    return {
      resource: paginatedTemplates,
      meta: {
        count: total,
        offset: filters.offset,
        limit: filters.limit,
      },
    };
  },

  deleteEmailTemplate: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock delete operation
  },

  duplicateEmailTemplate: async (template: EmailTemplate): Promise<EmailTemplate> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock duplicate operation
    return {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
    };
  },
};

// Table columns configuration
const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true, width: 'w-1/4' },
  { key: 'subject', label: 'Subject', sortable: true, width: 'w-1/3' },
  { key: 'to', label: 'To', sortable: true, width: 'w-1/6' },
  { key: 'from', label: 'From', sortable: true, width: 'w-1/6' },
  { key: 'last_modified_date', label: 'Last Modified', sortable: true, width: 'w-1/6' },
  { key: 'actions', label: 'Actions', sortable: false, width: 'w-32' },
];

// Constants
const DEFAULT_PAGE_SIZE = 25;
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export default function EmailTemplateTable({
  className = '',
  onTemplateEdit,
  onTemplateView,
  onTemplateDuplicate,
  onTemplateDelete,
}: EmailTemplateTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const { showConfirmDialog } = useConfirmDialog();

  // Table state
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  });

  // Debounced search for performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Memoized query key for React Query caching
  const queryKey = useMemo(() => [
    'email-templates',
    {
      search: debouncedSearch,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
      offset: filters.offset,
    },
  ], [debouncedSearch, filters.sortBy, filters.sortOrder, filters.limit, filters.offset]);

  // React Query for data fetching with intelligent caching
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => emailTemplatesApi.getEmailTemplates({
      ...filters,
      search: debouncedSearch,
    }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: emailTemplatesApi.deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Email template deleted successfully',
      });
    },
    onError: (error: Error) => {
      showNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to delete email template: ${error.message}`,
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: emailTemplatesApi.duplicateEmailTemplate,
    onSuccess: (duplicatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Email template duplicated successfully',
      });
      
      if (onTemplateDuplicate) {
        onTemplateDuplicate(duplicatedTemplate);
      }
    },
    onError: (error: Error) => {
      showNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to duplicate email template: ${error.message}`,
      });
    },
  });

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      offset: 0, // Reset to first page when searching
    }));
  }, []);

  const handleSort = useCallback((column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      offset: 0, // Reset to first page when sorting
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newPageSize,
      offset: 0, // Reset to first page when changing page size
    }));
  }, []);

  const handlePageChange = useCallback((newOffset: number) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset,
    }));
  }, []);

  const handleView = useCallback((template: EmailTemplate) => {
    if (onTemplateView) {
      onTemplateView(template);
    } else {
      router.push(`/system-settings/email-templates/${template.id}`);
    }
  }, [onTemplateView, router]);

  const handleEdit = useCallback((template: EmailTemplate) => {
    if (onTemplateEdit) {
      onTemplateEdit(template);
    } else {
      router.push(`/system-settings/email-templates/${template.id}/edit`);
    }
  }, [onTemplateEdit, router]);

  const handleDuplicate = useCallback((template: EmailTemplate) => {
    duplicateMutation.mutate(template);
  }, [duplicateMutation]);

  const handleDelete = useCallback(async (template: EmailTemplate) => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Email Template',
      message: `Are you sure you want to delete the email template "${template.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      deleteMutation.mutate(template.id);
    }
  }, [deleteMutation, showConfirmDialog]);

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return filters.sortOrder === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-primary-600" />
      : <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate pagination values
  const totalItems = data?.meta?.count || 0;
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalItems / filters.limit);
  const startItem = filters.offset + 1;
  const endItem = Math.min(filters.offset + filters.limit, totalItems);

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with search and filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search email templates..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                         dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                         text-sm transition-colors duration-200"
                aria-label="Search email templates"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={filters.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Items per page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                       shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200
                       bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Refresh table"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* Table header */}
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key as string)}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 
                               focus:outline-none focus:text-gray-700 dark:focus:text-gray-300"
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                      {renderSortIcon(column.key as string)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-6 py-8 text-center">
                  <div className="text-red-600 dark:text-red-400">
                    <p className="text-sm font-medium">Error loading email templates</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-500 underline"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : !data?.resource?.length ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filters.search ? 'No email templates match your search.' : 'No email templates found.'}
                  </p>
                </td>
              </tr>
            ) : (
              data.resource.map((template) => (
                <tr
                  key={template.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {template.description}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {template.subject}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {template.to}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {template.from}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(template.last_modified_date)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(template)}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-md
                                 text-gray-400 hover:text-primary-600 hover:bg-primary-50 
                                 dark:hover:text-primary-400 dark:hover:bg-primary-900/20
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                                 transition-colors duration-200"
                        aria-label={`View ${template.name}`}
                        title="View template"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-md
                                 text-gray-400 hover:text-blue-600 hover:bg-blue-50
                                 dark:hover:text-blue-400 dark:hover:bg-blue-900/20
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                 transition-colors duration-200"
                        aria-label={`Edit ${template.name}`}
                        title="Edit template"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicate(template)}
                        disabled={duplicateMutation.isPending}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-md
                                 text-gray-400 hover:text-green-600 hover:bg-green-50
                                 dark:hover:text-green-400 dark:hover:bg-green-900/20
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                        aria-label={`Duplicate ${template.name}`}
                        title="Duplicate template"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(template)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-md
                                 text-gray-400 hover:text-red-600 hover:bg-red-50
                                 dark:hover:text-red-400 dark:hover:bg-red-900/20
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                        aria-label={`Delete ${template.name}`}
                        title="Delete template"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.resource?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                disabled={filters.offset === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                         text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 
                         bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Previous page"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(filters.offset + filters.limit)}
                disabled={filters.offset + filters.limit >= totalItems}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                         text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 
                         bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export additional types for external use
export type { EmailTemplate, EmailTemplateTableProps };