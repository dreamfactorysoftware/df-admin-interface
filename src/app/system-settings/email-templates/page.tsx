'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Type definitions based on DreamFactory email template structure
interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  created_date: string;
  last_modified_date: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

interface EmailTemplatesResponse {
  resource: EmailTemplate[];
  meta: {
    count: number;
    total: number;
  };
}

// Form schema for search and filtering
const searchFormSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'subject', 'created_date', 'last_modified_date']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().min(10).max(100).default(25),
  offset: z.number().min(0).default(0),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

// Email templates API client functions
const emailTemplatesApi = {
  async getTemplates(params: SearchFormData): Promise<EmailTemplatesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.search) {
      searchParams.append('filter', `(name like "%${params.search}%" or subject like "%${params.search}%")`);
    }
    
    searchParams.append('order', `${params.sortBy} ${params.sortOrder}`);
    searchParams.append('limit', params.limit.toString());
    searchParams.append('offset', params.offset.toString());
    
    const response = await fetch(`/api/v2/system/email_template?${searchParams}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Session-Token': localStorage.getItem('session_token') || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch email templates: ${response.statusText}`);
    }
    
    return response.json();
  },

  async deleteTemplate(id: number): Promise<void> {
    const response = await fetch(`/api/v2/system/email_template/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Session-Token': localStorage.getItem('session_token') || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete email template: ${response.statusText}`);
    }
  },
};

// Main component
export default function EmailTemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state management with React Hook Form
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 25,
      offset: 0,
    },
  });

  const formData = watch();

  // React Query for data fetching with intelligent caching
  const {
    data: emailTemplatesData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['emailTemplates', formData],
    queryFn: () => emailTemplatesApi.getTemplates(formData),
    staleTime: 300000, // 5 minutes as per Section 5.2 requirements
    cacheTime: 900000, // 15 minutes cache time
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: emailTemplatesApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Email template deleted successfully');
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete email template: ${error.message}`);
    },
  });

  // Pagination logic
  const totalItems = emailTemplatesData?.meta.total || 0;
  const currentPage = Math.floor(formData.offset / formData.limit) + 1;
  const totalPages = Math.ceil(totalItems / formData.limit);

  const handlePageChange = (page: number) => {
    setValue('offset', (page - 1) * formData.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setValue('limit', newLimit);
    setValue('offset', 0); // Reset to first page
  };

  const handleSort = (column: string) => {
    if (formData.sortBy === column) {
      setValue('sortOrder', formData.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setValue('sortBy', column as any);
      setValue('sortOrder', 'asc');
    }
  };

  const handleSearch = (data: SearchFormData) => {
    setValue('offset', 0); // Reset to first page on search
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
    }
  };

  const handleCreate = () => {
    router.push('/system-settings/email-templates/create');
  };

  const handleEdit = (id: number) => {
    router.push(`/system-settings/email-templates/${id}`);
  };

  const handleView = (id: number) => {
    router.push(`/system-settings/email-templates/${id}?mode=view`);
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (formData.sortBy !== column) return null;
    return formData.sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Error Loading Email Templates
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const templates = emailTemplatesData?.resource || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Email Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage system email templates for automated notifications and communications.
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">
                    Search email templates
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Controller
                      control={control}
                      name="search"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Search by name or subject..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Page Size Selector */}
                <div className="sm:w-32">
                  <label htmlFor="limit" className="sr-only">
                    Items per page
                  </label>
                  <Controller
                    control={control}
                    name="limit"
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    )}
                  />
                </div>

                {/* Create Button */}
                <button
                  type="button"
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('name')}
                  >
                    Name {renderSortIcon('name')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('subject')}
                  >
                    Subject {renderSortIcon('subject')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('last_modified_date')}
                  >
                    Last Modified {renderSortIcon('last_modified_date')}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      {template.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {template.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {template.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {template.to?.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {template.to.length} recipient{template.to.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">No recipients</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(template.last_modified_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(template.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          title="View template"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(template.id)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
                          title="Edit template"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                          title="Delete template"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No email templates found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {formData.search ? 'No templates match your search criteria.' : 'Get started by creating your first email template.'}
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Create Email Template
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">{formData.offset + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(formData.offset + formData.limit, totalItems)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{totalItems}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-600 dark:text-primary-300'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setDeleteConfirmId(null)}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800" onClick={e => e.stopPropagation()}>
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                  <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Delete Email Template</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this email template? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 px-4 py-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}