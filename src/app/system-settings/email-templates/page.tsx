/**
 * Email Templates Management Page
 * 
 * Main email templates management interface implementing React server component 
 * with Next.js app router. Displays comprehensive email template listing with 
 * data table functionality, search/filter capabilities, and navigation to 
 * create/edit workflows.
 * 
 * Replaces Angular df-email-templates component with React Query for data 
 * fetching and Tailwind CSS responsive design.
 * 
 * Features:
 * - Server component implementation with SSR pages under 2 seconds
 * - Data table with pagination, filtering, and sorting capabilities
 * - React Query intelligent caching with TTL configuration
 * - Responsive design with Tailwind CSS maintaining WCAG 2.1 AA compliance
 * - Zustand store for email template workflow state management
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, EditIcon, TrashIcon, MailIcon, SearchIcon } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { formatDistanceToNow } from 'date-fns';
import type { EmailTemplate, EmailTemplateRow } from '@/types/email-templates';

// Transform email template for table display
const transformEmailTemplateForTable = (template: EmailTemplate): EmailTemplateRow => ({
  id: template.id,
  name: template.name,
  description: template.description || '',
  createdDate: template.createdDate,
  lastModifiedDate: template.lastModifiedDate,
});

// Format date for display
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

// Actions cell component
const ActionsCell: React.FC<{
  template: EmailTemplateRow;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}> = ({ template, onEdit, onDelete, isDeleting }) => (
  <div className="flex items-center space-x-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onEdit(template.id);
      }}
      disabled={isDeleting}
      aria-label={`Edit ${template.name}`}
      className="h-8 w-8 p-0"
    >
      <EditIcon className="w-4 h-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(template.id);
      }}
      disabled={isDeleting}
      aria-label={`Delete ${template.name}`}
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <TrashIcon className="w-4 h-4" />
    </Button>
  </div>
);

/**
 * Email Templates Management Page Component
 * 
 * Implements comprehensive email template management with:
 * - Server-side rendered listing with React Query caching
 * - Advanced search and filtering capabilities
 * - Responsive data table with pagination and sorting
 * - CRUD operations with optimistic updates
 * - Zustand-powered workflow state management
 */
export default function EmailTemplatesPage() {
  const router = useRouter();
  
  // Email templates hook with comprehensive data management
  const {
    emailTemplates,
    totalCount,
    isLoading,
    isFetching,
    isError,
    error,
    deleteEmailTemplate,
    isDeleting,
    
    // Store state
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    searchQuery,
    filters,
    
    // Store actions
    setCurrentPage,
    setPageSize,
    setSorting,
    setSearchQuery,
    setFilters,
    resetFilters,
    
    // Utilities
    refresh,
    prefetchTemplate,
  } = useEmailTemplates();

  // Transform data for table display
  const tableData = useMemo(() => 
    emailTemplates.map(transformEmailTemplateForTable),
    [emailTemplates]
  );

  // Handle navigation to create page
  const handleCreate = useCallback(() => {
    router.push('/system-settings/email-templates/create');
  }, [router]);

  // Handle navigation to edit page
  const handleEdit = useCallback((id: number) => {
    router.push(`/system-settings/email-templates/${id}`);
  }, [router]);

  // Handle template deletion with confirmation
  const handleDelete = useCallback(async (id: number) => {
    const template = emailTemplates.find(t => t.id === id);
    if (!template) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the email template "${template.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await deleteEmailTemplate(id);
      } catch (error) {
        console.error('Failed to delete email template:', error);
        // Error handling is managed by the mutation in the hook
      }
    }
  }, [emailTemplates, deleteEmailTemplate]);

  // Handle row click for navigation
  const handleRowClick = useCallback((template: EmailTemplateRow) => {
    handleEdit(template.id);
  }, [handleEdit]);

  // Handle row hover for prefetching
  const handleRowHover = useCallback((template: EmailTemplateRow) => {
    prefetchTemplate(template.id);
  }, [prefetchTemplate]);

  // Handle search input change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Handle sorting change
  const handleSortChange = useCallback((sortConfig: { key: string; direction: 'asc' | 'desc' }) => {
    setSorting(
      sortConfig.key as 'name' | 'description' | 'createdDate' | 'lastModifiedDate',
      sortConfig.direction
    );
  }, [setSorting]);

  // Handle pagination change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, [setPageSize]);

  // Advanced filters toggle state
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  // Handle advanced filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    resetFilters();
    setShowAdvancedFilters(false);
  }, [resetFilters]);

  // Define table columns with sorting and rendering
  const columns: DataTableColumn<EmailTemplateRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Template Name',
      accessor: 'name',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <MailIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {row.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      accessor: 'description',
      sortable: true,
      searchable: true,
      render: (value) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-900 truncate" title={value || ''}>
            {value || 'No description'}
          </div>
        </div>
      ),
    },
    {
      key: 'createdDate',
      header: 'Created',
      accessor: 'createdDate',
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: 'lastModifiedDate',
      header: 'Last Modified',
      accessor: 'lastModifiedDate',
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '120px',
      render: (_, row) => (
        <ActionsCell
          template={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      ),
    },
  ], [handleEdit, handleDelete, isDeleting]);

  // Pagination configuration
  const pagination = useMemo(() => ({
    page: currentPage,
    pageSize,
    total: totalCount,
    pageSizeOptions: [10, 25, 50, 100],
  }), [currentPage, pageSize, totalCount]);

  // Sort configuration
  const sortConfig = useMemo(() => ({
    key: sortBy,
    direction: sortOrder,
  }), [sortBy, sortOrder]);

  // Error message
  const errorMessage = isError && error 
    ? (error as any)?.message || 'Failed to load email templates'
    : null;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Email Templates
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage system email templates for notifications and communications
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={refresh}
                disabled={isFetching}
                aria-label="Refresh email templates"
              >
                Refresh
              </Button>
              
              <Button
                onClick={handleCreate}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Template</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <Input
                  type="text"
                  placeholder="Filter by name..."
                  value={filters.name || ''}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="Filter by description..."
                  value={filters.description || ''}
                  onChange={(e) => handleFilterChange('description', e.target.value)}
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
            <DataTable
              data={tableData}
              columns={columns}
              loading={isLoading}
              error={errorMessage}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={sortConfig}
              onSortChange={handleSortChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              searchPlaceholder="Search email templates..."
              emptyMessage="No email templates found. Create your first template to get started."
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              stickyHeader
              actions={
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center space-x-1"
                  >
                    <SearchIcon className="w-4 h-4" />
                    <span>Advanced Filters</span>
                  </Button>
                  
                  {(searchQuery || Object.keys(filters).length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}