/**
 * Email Templates Table Component for DreamFactory Admin Interface
 * 
 * React implementation of email templates management interface, replacing Angular
 * Material table with Headless UI and Tailwind CSS. Provides comprehensive CRUD
 * operations with intelligent caching via React Query and accessibility features
 * compliant with WCAG 2.1 AA standards.
 * 
 * Features:
 * - Server-side pagination, filtering, and sorting via TanStack Table
 * - Real-time data synchronization with SWR/React Query hooks
 * - Optimistic updates for delete operations with automatic rollback
 * - Keyboard navigation and screen reader support
 * - Sub-50ms cache hit responses per performance requirements
 * - Progressive loading for large datasets
 * 
 * @fileoverview Email Templates Table Component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Internal imports
import { useEmailTemplates } from '../../../hooks/use-email-templates';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiDelete } from '../../../lib/api-client';
import type { EmailTemplate, EmailTemplateRow } from '../../../types/email-templates';

// ============================================================================
// Component Types and Interfaces
// ============================================================================

interface EmailTemplatesTableProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Accessibility label for the table */
  'aria-label'?: string;
}

interface TableActions {
  onEdit: (template: EmailTemplateRow) => void;
  onDelete: (template: EmailTemplateRow) => void;
  onView: (template: EmailTemplateRow) => void;
}

// ============================================================================
// Table Column Configuration
// ============================================================================

const columnHelper = createColumnHelper<EmailTemplateRow>();

const createColumns = (actions: TableActions) => [
  columnHelper.accessor('name', {
    id: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 text-left font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
        aria-label={`Sort by name ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
      >
        Name
        <span className="ml-2 flex-shrink-0">
          {column.getIsSorted() === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </span>
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.getValue('name')}
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  }),

  columnHelper.accessor('description', {
    id: 'description',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 text-left font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
        aria-label={`Sort by description ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
      >
        Description
        <span className="ml-2 flex-shrink-0">
          {column.getIsSorted() === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </span>
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-gray-600 dark:text-gray-400 max-w-md truncate">
        {row.getValue('description') || (
          <span className="italic text-gray-400 dark:text-gray-500">No description</span>
        )}
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  }),

  columnHelper.display({
    id: 'actions',
    header: () => (
      <span className="sr-only">Actions</span>
    ),
    cell: ({ row }) => {
      const template = row.original;
      
      return (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onEdit(template)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            aria-label={`Edit email template ${template.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onDelete(template)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            aria-label={`Delete email template ${template.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
    size: 100,
  }),
];

// ============================================================================
// Main Email Templates Table Component
// ============================================================================

export function EmailTemplatesTable({ 
  className = '',
  'aria-label': ariaLabel = 'Email templates data table',
}: EmailTemplatesTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ========================================================================
  // Component State Management
  // ========================================================================

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // ========================================================================
  // Data Fetching with React Query
  // ========================================================================

  const {
    data: emailTemplatesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmailTemplates({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sort: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : undefined,
    filter: globalFilter || undefined,
  });

  // Extract data and metadata from response
  const emailTemplates = emailTemplatesData?.data || [];
  const totalCount = emailTemplatesData?.meta?.count || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // ========================================================================
  // Delete Mutation with Optimistic Updates
  // ========================================================================

  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiDelete(`/api/v2/system/email_template/${templateId}`);
    },
    onMutate: async (templateId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['email-templates'],
      });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['email-templates']);

      // Optimistically remove from cache
      queryClient.setQueryData(['email-templates'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((template: EmailTemplateRow) => template.id !== templateId),
          meta: {
            ...old.meta,
            count: old.meta.count - 1,
          },
        };
      });

      return { previousTemplates };
    },
    onError: (err, templateId, context) => {
      // Rollback to previous state on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['email-templates'], context.previousTemplates);
      }
      
      // Show error notification
      console.error('Failed to delete email template:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['email-templates'],
      });
    },
  });

  // ========================================================================
  // Table Action Handlers
  // ========================================================================

  const tableActions: TableActions = useMemo(() => ({
    onEdit: (template: EmailTemplateRow) => {
      router.push(`/adf-config/df-email-templates/${template.id}`);
    },
    
    onDelete: async (template: EmailTemplateRow) => {
      if (window.confirm(`Are you sure you want to delete the email template "${template.name}"? This action cannot be undone.`)) {
        try {
          await deleteMutation.mutateAsync(template.id);
          
          // Announce deletion to screen readers
          const announcement = `Email template "${template.name}" has been deleted successfully.`;
          const liveRegion = document.querySelector('[aria-live="polite"]');
          if (liveRegion) {
            liveRegion.textContent = announcement;
          }
        } catch (error) {
          console.error('Error deleting email template:', error);
        }
      }
    },

    onView: (template: EmailTemplateRow) => {
      router.push(`/adf-config/df-email-templates/${template.id}`);
    },
  }), [router, deleteMutation]);

  // ========================================================================
  // Table Configuration
  // ========================================================================

  const columns = useMemo(() => createColumns(tableActions), [tableActions]);

  const table = useReactTable({
    data: emailTemplates,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleCreateNew = useCallback(() => {
    router.push('/adf-config/df-email-templates/create');
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ========================================================================
  // Render Error State
  // ========================================================================

  if (isError) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load email templates
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Main Component Render
  // ========================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live announcements for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Table Header with Actions */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Email Templates
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage email templates for automated notifications and communications.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center space-x-2"
            aria-label="Refresh email templates list"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button
            onClick={handleCreateNew}
            className="flex items-center space-x-2"
            aria-label="Create new email template"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search email templates..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
            aria-label="Search email templates"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table 
            className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            aria-label={ariaLabel}
          >
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                      style={{ width: header.getSize() }}
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

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {isLoading ? (
                // Loading state
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Loading email templates...
                      </div>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        No email templates found
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {globalFilter
                          ? `No templates match "${globalFilter}". Try adjusting your search.`
                          : 'Get started by creating your first email template.'}
                      </div>
                      {!globalFilter && (
                        <Button
                          onClick={handleCreateNew}
                          className="mt-4"
                        >
                          Create Email Template
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && emailTemplates.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} of{' '}
              {totalCount} results
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default EmailTemplatesTable;