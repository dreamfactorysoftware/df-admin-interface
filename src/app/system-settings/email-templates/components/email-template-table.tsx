/**
 * Email Template Data Table Component
 * 
 * Comprehensive data table for email template management with React Query caching,
 * sorting, filtering, pagination, and row actions. Implements WCAG 2.1 AA compliance
 * and performance optimizations for large datasets.
 * 
 * Features:
 * - React Query intelligent caching with 2-minute stale time
 * - Zustand store integration for table state management
 * - Row actions: view, edit, delete, duplicate
 * - Responsive design with Tailwind CSS
 * - Bulk operations with selection management
 * - Comprehensive accessibility support
 * - Performance optimization with virtual scrolling capability
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { DataTable, DataTableColumn, SortConfig, PaginationConfig } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { EmailTemplate, EmailTemplateRow, EMAIL_TEMPLATE_CONSTANTS } from '@/types/email-templates';
import { cn } from '@/lib/utils';

// Action menu component for row actions
interface ActionMenuProps {
  template: EmailTemplate;
  onView: (template: EmailTemplate) => void;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
  onDuplicate: (template: EmailTemplate) => void;
  disabled?: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  template,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  disabled = false,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-md',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
        aria-label={`Actions for ${template.name}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v.01M12 12v.01M12 18v.01"
          />
        </svg>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onView(template)}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left',
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <EyeIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                  View Details
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onEdit(template)}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left',
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <PencilIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                  Edit Template
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onDuplicate(template)}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left',
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <DocumentDuplicateIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                  Duplicate Template
                </button>
              )}
            </Menu.Item>
            
            <hr className="my-1 border-gray-200" />
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onDelete(template)}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left',
                    active ? 'bg-red-50 text-red-700' : 'text-red-600',
                    'hover:bg-red-50 hover:text-red-700'
                  )}
                >
                  <TrashIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                  Delete Template
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Confirmation dialog for delete operations
interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string;
  isDeleting: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  templateName,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Delete
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete the email template "{templateName}"? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main email template table component
export interface EmailTemplateTableProps {
  className?: string;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

export const EmailTemplateTable: React.FC<EmailTemplateTableProps> = ({
  className,
  onCreateNew,
  showCreateButton = true,
}) => {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    template?: EmailTemplate;
  }>({ isOpen: false });

  // Email templates hook with React Query and Zustand integration
  const {
    emailTemplates,
    totalCount,
    isLoading,
    isFetching,
    isError,
    error,
    isDeleting,
    isBulkDeleting,
    deleteEmailTemplate,
    bulkDeleteEmailTemplates,
    currentPage,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    setCurrentPage,
    setPageSize,
    setSearchQuery,
    setSorting,
    setSelectedTemplate,
    prefetchTemplate,
    refresh,
  } = useEmailTemplates();

  // Column definitions for the data table
  const columns = useMemo<DataTableColumn<EmailTemplate>[]>(() => [
    {
      key: 'name',
      header: 'Template Name',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <button
            onClick={() => handleView(row)}
            className="text-left font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
          >
            {value}
          </button>
          {row.description && (
            <span className="text-sm text-gray-500 mt-1">
              {row.description.length > 60 
                ? `${row.description.substring(0, 60)}...` 
                : row.description
              }
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">
          {value || '(No subject)'}
        </span>
      ),
    },
    {
      key: 'createdDate',
      header: 'Created',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'lastModifiedDate',
      header: 'Modified',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <ActionMenu
          template={row}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(template) => setDeleteConfirmation({ isOpen: true, template })}
          onDuplicate={handleDuplicate}
          disabled={isDeleting || isBulkDeleting}
        />
      ),
    },
  ], [isDeleting, isBulkDeleting]);

  // Pagination configuration
  const paginationConfig = useMemo<PaginationConfig>(() => ({
    page: currentPage,
    pageSize,
    total: totalCount,
    pageSizeOptions: [10, 25, 50, 100],
  }), [currentPage, pageSize, totalCount]);

  // Sort configuration
  const sortConfig = useMemo<SortConfig>(() => ({
    key: sortBy,
    direction: sortOrder,
  }), [sortBy, sortOrder]);

  // Row action handlers
  const handleView = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    router.push(`/system-settings/email-templates/${template.id}`);
  }, [router, setSelectedTemplate]);

  const handleEdit = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    router.push(`/system-settings/email-templates/${template.id}/edit`);
  }, [router, setSelectedTemplate]);

  const handleDuplicate = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    router.push(`/system-settings/email-templates/create?duplicate=${template.id}`);
  }, [router, setSelectedTemplate]);

  const handleDelete = useCallback(() => {
    if (!deleteConfirmation.template) return;
    
    deleteEmailTemplate(deleteConfirmation.template.id);
    setDeleteConfirmation({ isOpen: false });
  }, [deleteConfirmation.template, deleteEmailTemplate]);

  // Bulk operations
  const handleBulkDelete = useCallback(() => {
    const selectedIds = Array.from(selectedRows).map(id => Number(id));
    if (selectedIds.length === 0) return;
    
    bulkDeleteEmailTemplates(selectedIds);
    setSelectedRows(new Set());
  }, [selectedRows, bulkDeleteEmailTemplates]);

  // Row selection handlers
  const handleSelectionChange = useCallback((newSelection: Set<string | number>) => {
    setSelectedRows(newSelection);
  }, []);

  const getRowId = useCallback((row: EmailTemplate) => row.id, []);

  // Table event handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, [setPageSize]);

  const handleSortChange = useCallback((sortConfig: SortConfig) => {
    setSorting(sortConfig.key as any, sortConfig.direction);
  }, [setSorting]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Row hover handler for prefetching
  const handleRowHover = useCallback((template: EmailTemplate) => {
    prefetchTemplate(template.id);
  }, [prefetchTemplate]);

  // Determine row class names for accessibility and interaction states
  const getRowClassName = useCallback((row: EmailTemplate, index: number) => {
    return cn(
      'transition-colors duration-150',
      selectedRows.has(row.id) && 'bg-primary-50',
      'hover:bg-gray-50 focus-within:bg-gray-50'
    );
  }, [selectedRows]);

  // Error message formatting
  const errorMessage = error ? 
    `Failed to load email templates: ${error instanceof Error ? error.message : 'Unknown error'}` : 
    null;

  // Table actions component
  const tableActions = (
    <div className="flex items-center space-x-2">
      {/* Bulk actions */}
      {selectedRows.size > 0 && (
        <>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            {isBulkDeleting 
              ? `Deleting ${selectedRows.size}...` 
              : `Delete ${selectedRows.size} Selected`
            }
          </Button>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}
      
      {/* Refresh button */}
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isFetching}
        className="flex items-center"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </Button>
      
      {/* Create new button */}
      {showCreateButton && (
        <Button
          onClick={onCreateNew || (() => router.push('/system-settings/email-templates/create'))}
          size="sm"
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table container with comprehensive functionality */}
      <DataTable
        data={emailTemplates}
        columns={columns}
        loading={isLoading}
        error={errorMessage}
        pagination={paginationConfig}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search email templates by name or description..."
        emptyMessage="No email templates found. Create your first template to get started."
        actions={tableActions}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        getRowId={getRowId}
        rowClassName={getRowClassName}
        onRowClick={handleView}
        showSearch={true}
        showPagination={true}
        stickyHeader={true}
        className="bg-white border border-gray-200 rounded-lg shadow-sm"
      />

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false })}
        onConfirm={handleDelete}
        templateName={deleteConfirmation.template?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default EmailTemplateTable;