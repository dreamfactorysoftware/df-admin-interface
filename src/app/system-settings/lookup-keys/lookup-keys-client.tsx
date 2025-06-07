/**
 * Global Lookup Keys Client Component
 * 
 * Client-side interactive component for global lookup keys management within the 
 * system settings interface. Implements comprehensive CRUD operations, real-time 
 * search and filtering, batch operations, and optimistic updates using SWR/React Query 
 * for intelligent caching and synchronization.
 * 
 * Replaces Angular DfGlobalLookupKeysComponent service injections with React Query 
 * hooks for lookup key operations per Section 4.3 state management workflows. 
 * Implements React Hook Form integration for form management per React/Next.js 
 * Integration Requirements.
 * 
 * Features:
 * - Real-time search and filtering with debounced input
 * - Comprehensive CRUD operations with optimistic updates
 * - Batch operations for multiple lookup key management
 * - Virtual scrolling for large datasets (1000+ entries)
 * - WCAG 2.1 AA compliant with full keyboard navigation
 * - Error recovery with user-friendly messaging
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @fileoverview Interactive client component for lookup keys management
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebouncedCallback } from 'use-debounce';
import { 
  useLookupKeys, 
  type LookupKey, 
  type LookupKeyInput 
} from './use-lookup-keys';
import { LookupKeysForm } from './lookup-keys-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Snackbar } from '@/components/ui/snackbar';
import { SearchDialog } from '@/components/ui/search-dialog';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Component state management interface
 */
interface LookupKeysState {
  /** Currently selected lookup key IDs for batch operations */
  selectedIds: Set<number>;
  /** Search query for filtering lookup keys */
  searchQuery: string;
  /** Current page for pagination */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Sort configuration */
  sortBy: 'name' | 'value' | 'private' | 'created_date' | 'last_modified_date';
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Filter for private/public keys */
  privacyFilter: 'all' | 'private' | 'public';
  /** Show form dialog state */
  showForm: boolean;
  /** Form mode for create/edit operations */
  formMode: 'create' | 'edit';
  /** Currently editing lookup key */
  editingKey: LookupKey | null;
  /** Show delete confirmation dialog */
  showDeleteDialog: boolean;
  /** Lookup key to delete */
  deletingKey: LookupKey | null;
  /** Show batch delete confirmation */
  showBatchDeleteDialog: boolean;
  /** Show advanced search dialog */
  showSearchDialog: boolean;
}

/**
 * Table column configuration
 */
interface TableColumn {
  key: keyof LookupKey | 'actions';
  label: string;
  width: string;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default page size for lookup keys table
 */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Available page size options
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Table column configuration
 */
const TABLE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', width: 'col-span-3', sortable: true },
  { key: 'value', label: 'Value', width: 'col-span-4', sortable: false },
  { key: 'private', label: 'Privacy', width: 'col-span-1', sortable: true, align: 'center' },
  { key: 'last_modified_date', label: 'Modified', width: 'col-span-2', sortable: true },
  { key: 'actions', label: 'Actions', width: 'col-span-2', sortable: false, align: 'right' },
];

/**
 * Virtual scrolling configuration
 */
const VIRTUAL_CONFIG = {
  /** Item height in pixels for virtual scrolling calculations */
  itemHeight: 64,
  /** Overscan count for smooth scrolling */
  overscan: 10,
  /** Enable virtual scrolling when item count exceeds this threshold */
  threshold: 50,
};

// ============================================================================
// Main Component Implementation
// ============================================================================

/**
 * LookupKeysClient Component
 * 
 * Interactive client-side component providing comprehensive lookup keys management
 * functionality with modern React patterns, optimistic updates, and intelligent
 * caching through SWR/React Query integration.
 */
export function LookupKeysClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // State Management
  // ============================================================================

  const [state, setState] = useState<LookupKeysState>({
    selectedIds: new Set(),
    searchQuery: searchParams?.get('search') || '',
    currentPage: parseInt(searchParams?.get('page') || '1', 10),
    pageSize: parseInt(searchParams?.get('size') || String(DEFAULT_PAGE_SIZE), 10),
    sortBy: (searchParams?.get('sort') as LookupKeysState['sortBy']) || 'name',
    sortDirection: (searchParams?.get('direction') as LookupKeysState['sortDirection']) || 'asc',
    privacyFilter: (searchParams?.get('privacy') as LookupKeysState['privacyFilter']) || 'all',
    showForm: false,
    formMode: 'create',
    editingKey: null,
    showDeleteDialog: false,
    deletingKey: null,
    showBatchDeleteDialog: false,
    showSearchDialog: false,
  });

  // ============================================================================
  // Data Fetching and Mutations
  // ============================================================================

  // Build query parameters for lookup keys hook
  const queryOptions = useMemo(() => {
    const filters: string[] = [];
    
    // Search filter
    if (state.searchQuery.trim()) {
      filters.push(`(name like "%${state.searchQuery}%" or value like "%${state.searchQuery}%")`);
    }
    
    // Privacy filter
    if (state.privacyFilter !== 'all') {
      filters.push(`private=${state.privacyFilter === 'private'}`);
    }
    
    return {
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
      sort: `${state.sortBy} ${state.sortDirection}`,
      limit: state.pageSize,
      offset: (state.currentPage - 1) * state.pageSize,
      includeCount: true,
      fields: 'id,name,value,private,description,created_date,last_modified_date',
    };
  }, [state.searchQuery, state.privacyFilter, state.sortBy, state.sortDirection, state.pageSize, state.currentPage]);

  // Initialize lookup keys hook with query options
  const {
    lookupKeys,
    meta,
    isLoading,
    isError,
    error,
    isFetching,
    mutations,
    utils,
    isMutating,
  } = useLookupKeys(queryOptions);

  // ============================================================================
  // URL State Synchronization
  // ============================================================================

  /**
   * Update URL parameters to reflect current state
   * Enables shareable URLs and browser back/forward navigation
   */
  const updateUrlParams = useCallback((newState: Partial<LookupKeysState>) => {
    const params = new URLSearchParams();
    
    const updatedState = { ...state, ...newState };
    
    if (updatedState.searchQuery) params.set('search', updatedState.searchQuery);
    if (updatedState.currentPage > 1) params.set('page', String(updatedState.currentPage));
    if (updatedState.pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(updatedState.pageSize));
    if (updatedState.sortBy !== 'name') params.set('sort', updatedState.sortBy);
    if (updatedState.sortDirection !== 'asc') params.set('direction', updatedState.sortDirection);
    if (updatedState.privacyFilter !== 'all') params.set('privacy', updatedState.privacyFilter);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/app/system-settings/lookup-keys${newUrl}`, { scroll: false });
  }, [state, router]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Debounced search handler to prevent excessive API calls
   */
  const debouncedSearch = useDebouncedCallback((searchValue: string) => {
    const newState = { 
      searchQuery: searchValue, 
      currentPage: 1 // Reset to first page on search
    };
    setState(prev => ({ ...prev, ...newState }));
    updateUrlParams(newState);
  }, 300);

  /**
   * Handle search input changes
   */
  const handleSearchChange = useCallback((value: string) => {
    // Update UI immediately for responsiveness
    setState(prev => ({ ...prev, searchQuery: value }));
    // Debounce the actual search operation
    debouncedSearch(value);
  }, [debouncedSearch]);

  /**
   * Handle sort column selection
   */
  const handleSort = useCallback((column: keyof LookupKey) => {
    const newDirection = state.sortBy === column && state.sortDirection === 'asc' ? 'desc' : 'asc';
    const newState = {
      sortBy: column as LookupKeysState['sortBy'],
      sortDirection: newDirection,
      currentPage: 1, // Reset to first page on sort change
    };
    setState(prev => ({ ...prev, ...newState }));
    updateUrlParams(newState);
  }, [state.sortBy, state.sortDirection, updateUrlParams]);

  /**
   * Handle page navigation
   */
  const handlePageChange = useCallback((page: number) => {
    const newState = { currentPage: page };
    setState(prev => ({ ...prev, ...newState }));
    updateUrlParams(newState);
  }, [updateUrlParams]);

  /**
   * Handle page size changes
   */
  const handlePageSizeChange = useCallback((size: number) => {
    const newState = { 
      pageSize: size, 
      currentPage: 1 // Reset to first page when changing page size
    };
    setState(prev => ({ ...prev, ...newState }));
    updateUrlParams(newState);
  }, [updateUrlParams]);

  /**
   * Handle row selection for batch operations
   */
  const handleRowSelect = useCallback((id: number, selected: boolean) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      if (selected) {
        newSelectedIds.add(id);
      } else {
        newSelectedIds.delete(id);
      }
      return { ...prev, selectedIds: newSelectedIds };
    });
  }, []);

  /**
   * Handle select all/none toggle
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedIds: selected ? new Set(lookupKeys.map(key => key.id!)) : new Set(),
    }));
  }, [lookupKeys]);

  /**
   * Handle privacy filter changes
   */
  const handlePrivacyFilterChange = useCallback((filter: LookupKeysState['privacyFilter']) => {
    const newState = { 
      privacyFilter: filter, 
      currentPage: 1 // Reset to first page on filter change
    };
    setState(prev => ({ ...prev, ...newState }));
    updateUrlParams(newState);
  }, [updateUrlParams]);

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Open create form dialog
   */
  const handleCreate = useCallback(() => {
    setState(prev => ({
      ...prev,
      showForm: true,
      formMode: 'create',
      editingKey: null,
    }));
  }, []);

  /**
   * Open edit form dialog
   */
  const handleEdit = useCallback((lookupKey: LookupKey) => {
    setState(prev => ({
      ...prev,
      showForm: true,
      formMode: 'edit',
      editingKey: lookupKey,
    }));
  }, []);

  /**
   * Handle form submission (create/update)
   */
  const handleFormSubmit = useCallback(async (data: LookupKeyInput) => {
    try {
      if (state.formMode === 'create') {
        await mutations.create.mutateAsync(data);
      } else if (state.editingKey) {
        await mutations.update.mutateAsync({
          id: state.editingKey.id!,
          ...data,
        });
      }
      
      // Close form on success
      setState(prev => ({
        ...prev,
        showForm: false,
        editingKey: null,
      }));
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Form submission error:', error);
    }
  }, [state.formMode, state.editingKey, mutations]);

  /**
   * Close form dialog
   */
  const handleFormCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showForm: false,
      editingKey: null,
    }));
  }, []);

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = useCallback((lookupKey: LookupKey) => {
    setState(prev => ({
      ...prev,
      showDeleteDialog: true,
      deletingKey: lookupKey,
    }));
  }, []);

  /**
   * Confirm single lookup key deletion
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (state.deletingKey?.id) {
      try {
        await mutations.delete.mutateAsync({ id: state.deletingKey.id });
        setState(prev => ({
          ...prev,
          showDeleteDialog: false,
          deletingKey: null,
        }));
      } catch (error) {
        // Error handling is managed by the mutation hook
        console.error('Delete error:', error);
      }
    }
  }, [state.deletingKey, mutations]);

  /**
   * Cancel delete operation
   */
  const handleDeleteCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDeleteDialog: false,
      deletingKey: null,
    }));
  }, []);

  /**
   * Open batch delete confirmation dialog
   */
  const handleBatchDeleteClick = useCallback(() => {
    if (state.selectedIds.size > 0) {
      setState(prev => ({
        ...prev,
        showBatchDeleteDialog: true,
      }));
    }
  }, [state.selectedIds.size]);

  /**
   * Confirm batch deletion
   */
  const handleBatchDeleteConfirm = useCallback(async () => {
    if (state.selectedIds.size > 0) {
      try {
        await mutations.deleteBulk.mutateAsync({ 
          ids: Array.from(state.selectedIds) 
        });
        setState(prev => ({
          ...prev,
          showBatchDeleteDialog: false,
          selectedIds: new Set(),
        }));
      } catch (error) {
        // Error handling is managed by the mutation hook
        console.error('Batch delete error:', error);
      }
    }
  }, [state.selectedIds, mutations]);

  /**
   * Cancel batch delete operation
   */
  const handleBatchDeleteCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showBatchDeleteDialog: false,
    }));
  }, []);

  // ============================================================================
  // Virtual Scrolling Setup
  // ============================================================================

  /**
   * Virtual scrolling for large datasets
   */
  const virtualizer = useVirtualizer({
    count: lookupKeys.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_CONFIG.itemHeight,
    overscan: VIRTUAL_CONFIG.overscan,
  });

  // Enable virtual scrolling only for large datasets
  const useVirtualScrolling = lookupKeys.length > VIRTUAL_CONFIG.threshold;

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Get existing lookup key names for validation
   */
  const existingNames = useMemo(() => 
    lookupKeys.map(key => key.name).filter(name => 
      state.formMode === 'edit' ? name !== state.editingKey?.name : true
    ), 
    [lookupKeys, state.formMode, state.editingKey?.name]
  );

  /**
   * Calculate pagination information
   */
  const paginationInfo = useMemo(() => {
    const totalItems = meta?.count || 0;
    const totalPages = Math.ceil(totalItems / state.pageSize);
    const startItem = ((state.currentPage - 1) * state.pageSize) + 1;
    const endItem = Math.min(state.currentPage * state.pageSize, totalItems);
    
    return {
      totalItems,
      totalPages,
      startItem,
      endItem,
      hasNextPage: state.currentPage < totalPages,
      hasPrevPage: state.currentPage > 1,
    };
  }, [meta?.count, state.pageSize, state.currentPage]);

  /**
   * Get selection status for current page
   */
  const selectionStatus = useMemo(() => {
    const pageIds = lookupKeys.map(key => key.id!);
    const selectedPageIds = pageIds.filter(id => state.selectedIds.has(id));
    
    return {
      selectedCount: state.selectedIds.size,
      pageSelectedCount: selectedPageIds.length,
      isAllPageSelected: pageIds.length > 0 && selectedPageIds.length === pageIds.length,
      isPartialPageSelected: selectedPageIds.length > 0 && selectedPageIds.length < pageIds.length,
    };
  }, [lookupKeys, state.selectedIds]);

  // ============================================================================
  // Render Methods
  // ============================================================================

  /**
   * Render loading state
   */
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading lookup keys...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (isError) {
    return (
      <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-error-800 dark:text-error-200">
              Unable to load lookup keys
            </h3>
            <p className="mt-1 text-sm text-error-700 dark:text-error-300">
              {error?.message || 'An error occurred while fetching lookup keys.'}
            </p>
            <div className="mt-3">
              <button
                onClick={() => utils.refresh()}
                className="bg-error-100 hover:bg-error-200 dark:bg-error-800 dark:hover:bg-error-700 text-error-800 dark:text-error-200 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render main component interface
   */
  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search lookup keys
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg 
                  className="h-5 w-5 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search by name or value..."
                value={state.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoComplete="off"
              />
              {state.searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <svg 
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Privacy Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="privacy-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Privacy:
            </label>
            <select
              id="privacy-filter"
              value={state.privacyFilter}
              onChange={(e) => handlePrivacyFilterChange(e.target.value as LookupKeysState['privacyFilter'])}
              className="block w-32 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show:
            </label>
            <select
              id="page-size"
              value={state.pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
              className="block w-20 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreate}
              disabled={isMutating}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Lookup Key
            </button>

            {selectionStatus.selectedCount > 0 && (
              <button
                onClick={handleBatchDeleteClick}
                disabled={isMutating}
                className="bg-error-600 hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected ({selectionStatus.selectedCount})
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {paginationInfo.totalItems > 0 ? (
              <>
                Showing {paginationInfo.startItem} to {paginationInfo.endItem} of {paginationInfo.totalItems} lookup keys
                {state.searchQuery && (
                  <span className="ml-1">
                    for "{state.searchQuery}"
                  </span>
                )}
              </>
            ) : (
              state.searchQuery ? `No lookup keys found for "${state.searchQuery}"` : 'No lookup keys found'
            )}
          </div>
        </div>
      </div>

      {/* Lookup Keys Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {lookupKeys.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Select All Checkbox */}
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectionStatus.isAllPageSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = selectionStatus.isPartialPageSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    aria-label="Select all lookup keys on this page"
                  />
                </div>

                {/* Column Headers */}
                {TABLE_COLUMNS.map((column) => (
                  <div 
                    key={column.key} 
                    className={`${column.width} flex items-center ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key as keyof LookupKey)}
                        className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:text-gray-700 dark:focus:text-gray-300"
                      >
                        {column.label}
                        <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300">
                          {state.sortBy === column.key ? (
                            state.sortDirection === 'asc' ? (
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            <svg className="h-3 w-3 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {column.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Table Body */}
            <div 
              ref={parentRef}
              className={useVirtualScrolling ? 'h-96 overflow-auto' : ''}
            >
              {useVirtualScrolling ? (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const lookupKey = lookupKeys[virtualItem.index];
                    if (!lookupKey) return null;

                    return (
                      <div
                        key={lookupKey.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {/* Row content will be rendered here */}
                        {renderLookupKeyRow(lookupKey)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lookupKeys.map((lookupKey) => renderLookupKeyRow(lookupKey))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {state.searchQuery || state.privacyFilter !== 'all' 
                ? 'No matching lookup keys found' 
                : 'No lookup keys configured'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {state.searchQuery || state.privacyFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first global lookup key.'
              }
            </p>
            {(!state.searchQuery && state.privacyFilter === 'all') && (
              <div className="mt-6">
                <button
                  onClick={handleCreate}
                  disabled={isMutating}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Lookup Key
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={!paginationInfo.hasPrevPage || isFetching}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={!paginationInfo.hasNextPage || isFetching}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{state.currentPage}</span> of{' '}
                  <span className="font-medium">{paginationInfo.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(state.currentPage - 1)}
                    disabled={!paginationInfo.hasPrevPage || isFetching}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Previous page"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                    let pageNumber: number;
                    
                    if (paginationInfo.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (state.currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (state.currentPage >= paginationInfo.totalPages - 2) {
                      pageNumber = paginationInfo.totalPages - 4 + i;
                    } else {
                      pageNumber = state.currentPage - 2 + i;
                    }

                    const isCurrentPage = pageNumber === state.currentPage;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={isFetching}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isCurrentPage
                            ? 'z-10 bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                        aria-current={isCurrentPage ? 'page' : undefined}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(state.currentPage + 1)}
                    disabled={!paginationInfo.hasNextPage || isFetching}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Next page"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {state.showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={handleFormCancel}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <LookupKeysForm
                initialData={state.editingKey || undefined}
                existingNames={existingNames}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={isMutating}
                mode={state.formMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {state.showDeleteDialog && state.deletingKey && (
        <ConfirmDialog
          isOpen={state.showDeleteDialog}
          title="Delete Lookup Key"
          message={
            <div>
              <p className="mb-2">
                Are you sure you want to delete the lookup key <strong>"{state.deletingKey.name}"</strong>?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone and may affect applications that depend on this lookup key.
              </p>
            </div>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={mutations.delete.isPending}
          variant="danger"
        />
      )}

      {/* Batch Delete Confirmation Dialog */}
      {state.showBatchDeleteDialog && (
        <ConfirmDialog
          isOpen={state.showBatchDeleteDialog}
          title="Delete Multiple Lookup Keys"
          message={
            <div>
              <p className="mb-2">
                Are you sure you want to delete <strong>{selectionStatus.selectedCount}</strong> selected lookup keys?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone and may affect applications that depend on these lookup keys.
              </p>
            </div>
          }
          confirmLabel={`Delete ${selectionStatus.selectedCount} Keys`}
          cancelLabel="Cancel"
          onConfirm={handleBatchDeleteConfirm}
          onCancel={handleBatchDeleteCancel}
          isLoading={mutations.deleteBulk.isPending}
          variant="danger"
        />
      )}

      {/* Loading Overlay */}
      {isFetching && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {isMutating ? 'Saving changes...' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // Helper Render Methods
  // ============================================================================

  /**
   * Render individual lookup key row
   */
  function renderLookupKeyRow(lookupKey: LookupKey) {
    const isSelected = state.selectedIds.has(lookupKey.id!);
    
    return (
      <div
        key={lookupKey.id}
        className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
          isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
        }`}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Selection Checkbox */}
          <div className="col-span-1 flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelect(lookupKey.id!, e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              aria-label={`Select lookup key "${lookupKey.name}"`}
            />
          </div>

          {/* Name */}
          <div className="col-span-3">
            <div className="flex items-center">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={lookupKey.name}>
                  {lookupKey.name}
                </div>
                {lookupKey.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={lookupKey.description}>
                    {lookupKey.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="col-span-4">
            <div 
              className="text-sm text-gray-900 dark:text-gray-100 truncate" 
              title={lookupKey.value}
            >
              {lookupKey.value || (
                <span className="text-gray-400 dark:text-gray-500 italic">No value</span>
              )}
            </div>
          </div>

          {/* Privacy Status */}
          <div className="col-span-1 text-center">
            {lookupKey.private ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Private
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.963 8.963 0 0110 18a8.963 8.963 0 01-7.668-9.973z" clipRule="evenodd" />
                </svg>
                Public
              </span>
            )}
          </div>

          {/* Last Modified */}
          <div className="col-span-2">
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {lookupKey.last_modified_date ? (
                <time 
                  dateTime={lookupKey.last_modified_date}
                  title={new Date(lookupKey.last_modified_date).toLocaleString()}
                >
                  {new Date(lookupKey.last_modified_date).toLocaleDateString()}
                </time>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Unknown</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-2 flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(lookupKey)}
              disabled={isMutating}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Edit lookup key "${lookupKey.name}"`}
              title="Edit lookup key"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={() => handleDeleteClick(lookupKey)}
              disabled={isMutating}
              className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded focus:outline-none focus:ring-2 focus:ring-error-500"
              aria-label={`Delete lookup key "${lookupKey.name}"`}
              title="Delete lookup key"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// Export
// ============================================================================

export default LookupKeysClient;