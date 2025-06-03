'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState
} from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-hot-toast';

// Types (based on existing Angular types but adapted for React)
interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  defaults?: any;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}

interface EmailTemplateRow {
  id: number;
  name: string;
  description?: string;
}

interface PaginatedResponse<T> {
  resource: T[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

// Mock hook for email templates data (based on SWR/React Query patterns)
function useEmailTemplates(params: {
  limit: number;
  offset: number;
  filter?: string;
  sort?: string;
}) {
  const [data, setData] = useState<PaginatedResponse<EmailTemplate>>({
    resource: [
      {
        id: 1,
        name: 'Welcome Email',
        description: 'Welcome email template for new users',
        subject: 'Welcome to DreamFactory',
        bodyHtml: '<h1>Welcome!</h1>',
        createdDate: '2024-01-01T00:00:00Z',
        lastModifiedDate: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Password Reset',
        description: 'Password reset email template',
        subject: 'Reset Your Password',
        bodyHtml: '<p>Click here to reset your password</p>',
        createdDate: '2024-01-02T00:00:00Z',
        lastModifiedDate: '2024-01-02T00:00:00Z'
      },
      {
        id: 3,
        name: 'Account Verification',
        description: 'Email verification template',
        subject: 'Verify Your Account',
        bodyHtml: '<p>Please verify your account</p>',
        createdDate: '2024-01-03T00:00:00Z',
        lastModifiedDate: '2024-01-03T00:00:00Z'
      }
    ],
    meta: {
      count: 3,
      limit: params.limit,
      offset: params.offset
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call with filter
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filteredData = data.resource;
      if (params.filter) {
        const filterLower = params.filter.toLowerCase();
        filteredData = data.resource.filter(template =>
          template.name.toLowerCase().includes(filterLower) ||
          template.description?.toLowerCase().includes(filterLower)
        );
      }

      setData(prev => ({
        ...prev,
        resource: filteredData
      }));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [params.filter, data.resource]);

  const mutate = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    mutate,
    refetch
  };
}

// Mock mutation hook for delete operations
function useDeleteEmailTemplate() {
  const deleteTemplate = useCallback(async (id: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Optimistic update would be handled here
    toast.success('Email template deleted successfully');
    return { success: true };
  }, []);

  return {
    mutate: deleteTemplate,
    isLoading: false,
    error: null
  };
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const typeClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${typeClasses[type]}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const TableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-4 h-10 bg-gray-200 rounded"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="mb-2 h-16 bg-gray-100 rounded"></div>
    ))}
  </div>
);

// Main Email Templates Table Component
const EmailTemplatesTable: React.FC = () => {
  const router = useRouter();
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    template: EmailTemplateRow | null;
  }>({
    isOpen: false,
    template: null
  });

  // Data fetching
  const {
    data: templatesData,
    isLoading,
    error,
    mutate,
    refetch
  } = useEmailTemplates({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    filter: globalFilter,
    sort: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : undefined
  });

  const { mutate: deleteTemplate, isLoading: isDeleting } = useDeleteEmailTemplate();

  // Transform data for table
  const tableData = useMemo(() => {
    return templatesData?.resource.map((template): EmailTemplateRow => ({
      id: template.id,
      name: template.name,
      description: template.description
    })) || [];
  }, [templatesData]);

  // Table columns configuration
  const columns = useMemo<ColumnDef<EmailTemplateRow>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2 font-medium text-gray-900 hover:text-gray-600"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label={`Sort by name ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          <span>Name</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2 font-medium text-gray-900 hover:text-gray-600"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label={`Sort by description ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          <span>Description</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-gray-500">{row.getValue('description') || '—'}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const template = row.original;
        
        return (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button 
                className="flex items-center rounded-full bg-gray-100 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={`Actions for ${template.name}`}
              >
                <span className="sr-only">Open options</span>
                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
              </Menu.Button>
            </div>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push(`/adf-config/df-email-templates/${template.id}`)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                        Edit Template
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, template })}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <TrashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" aria-hidden="true" />
                        Delete Template
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        );
      },
    },
  ], [router]);

  // Initialize table
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    manualPagination: true,
    pageCount: Math.ceil((templatesData?.meta.count || 0) / pagination.pageSize),
  });

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.template) return;

    try {
      await deleteTemplate(deleteDialog.template.id);
      mutate(); // Trigger refetch
      setDeleteDialog({ isOpen: false, template: null });
    } catch (error) {
      toast.error('Failed to delete email template');
      console.error('Delete error:', error);
    }
  }, [deleteDialog.template, deleteTemplate, mutate]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Table refreshed');
  }, [refetch]);

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading email templates</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={handleRefresh}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-templates-table">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Email Templates</h3>
        <div className="mt-3 flex sm:ml-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh table data"
          >
            <ArrowPathIcon className={`-ml-0.5 mr-1.5 h-5 w-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            className="ml-3 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => router.push('/adf-config/df-email-templates/create')}
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Create Template
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="block w-80 rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              aria-label="Search email templates"
            />
            <FunnelIcon className="absolute left-3 top-2 h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span>
            Showing {table.getRowModel().rows.length} of {templatesData?.meta.count || 0} results
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="whitespace-nowrap px-6 py-4 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Empty state */}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {globalFilter ? 'No templates found matching your search.' : 'No email templates found.'}
                </div>
                {!globalFilter && (
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    onClick={() => router.push('/adf-config/df-email-templates/create')}
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Create your first template
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{pagination.pageIndex * pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((pagination.pageIndex + 1) * pagination.pageSize, templatesData?.meta.count || 0)}
                </span>{' '}
                of <span className="font-medium">{templatesData?.meta.count || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                  {pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, template: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Email Template"
        message={`Are you sure you want to delete "${deleteDialog.template?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Accessibility announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && 'Loading email templates...'}
        {isDeleting && 'Deleting email template...'}
      </div>
    </div>
  );
};

export default EmailTemplatesTable;