'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, Transition } from '@headlessui/react';
import { 
  TrashIcon, 
  PencilIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';

// Types - Based on the original Angular implementation
interface CorsConfigData {
  createdById: number | null;
  createdDate: string | null;
  description: string;
  enabled: boolean;
  exposedHeader: string | null;
  header: string;
  id: number;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
  maxAge: number;
  method: string[];
  origin: string;
  path: string;
  supportsCredentials: boolean;
}

interface GenericListResponse<T> {
  resource: T[];
  meta: {
    count: number;
    total: number;
  };
}

interface TableProps {
  onEdit?: (corsConfig: CorsConfigData) => void;
  onRefresh?: () => void;
  className?: string;
}

// Custom hook for CORS data management
const useCorsData = () => {
  const queryClient = useQueryClient();

  // Fetch CORS configurations with React Query
  const {
    data: corsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<GenericListResponse<CorsConfigData>>({
    queryKey: ['cors-configs'],
    queryFn: async () => {
      // Simulate API call - replace with actual API client
      const response = await fetch('/api/v2/system/cors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // 1 minute for real-time updates
  });

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v2/system/cors/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete CORS config: ${response.status}`);
      }

      return response.json();
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cors-configs'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<GenericListResponse<CorsConfigData>>(['cors-configs']);

      // Optimistically update cache
      if (previousData) {
        queryClient.setQueryData<GenericListResponse<CorsConfigData>>(['cors-configs'], {
          ...previousData,
          resource: previousData.resource.filter(item => item.id !== deletedId),
          meta: {
            ...previousData.meta,
            count: previousData.meta.count - 1,
            total: previousData.meta.total - 1,
          }
        });
      }

      return { previousData };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['cors-configs'], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['cors-configs'] });
    },
  });

  return {
    corsData: corsData?.resource || [],
    totalCount: corsData?.meta?.count || 0,
    isLoading,
    isError,
    error,
    refetch,
    deleteCors: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

// Main CORS Table Component
export const CorsTable: React.FC<TableProps> = ({ 
  onEdit, 
  onRefresh,
  className = '' 
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [corsToDelete, setCorsToDelete] = useState<CorsConfigData | null>(null);

  const {
    corsData,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
    deleteCors,
    isDeleting,
  } = useCorsData();

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return corsData;
    
    return corsData.filter(cors => 
      cors.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cors.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cors.origin.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [corsData, searchTerm]);

  // Virtual scrolling setup for large datasets (1000+ entries)
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10, // Render 10 extra items outside viewport
  });

  // Handle delete confirmation
  const handleDeleteClick = useCallback((cors: CorsConfigData) => {
    setCorsToDelete(cors);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (corsToDelete) {
      deleteCors(corsToDelete.id);
      setDeleteModalOpen(false);
      setCorsToDelete(null);
    }
  }, [corsToDelete, deleteCors]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setCorsToDelete(null);
  }, []);

  // Handle row selection
  const handleRowSelect = useCallback((id: number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedRows(newSelection);
  }, [selectedRows]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(cors => cors.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [filteredData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Format date for display
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Format methods array for display
  const formatMethods = useCallback((methods: string[]) => {
    if (!methods || methods.length === 0) return 'ALL';
    return methods.join(', ');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading CORS configurations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="flex flex-col items-center space-y-4 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error Loading Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error instanceof Error ? error.message : 'Failed to load CORS configurations'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow ${className}`}>
      {/* Header with search and actions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              CORS Configurations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage Cross-Origin Resource Sharing policies ({totalCount} total)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search CORS policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table container with virtualization */}
      <div 
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }} // Fixed height for virtualization
      >
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No CORS configurations
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No configurations match your search.' : 'Get started by creating a new CORS policy.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Table header */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4">
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Path</div>
                  <div className="col-span-2">Origin</div>
                  <div className="col-span-2">Methods</div>
                  <div className="col-span-2">Max Age</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
            </div>

            {/* Virtual rows */}
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const cors = filteredData[virtualItem.index];
              const isSelected = selectedRows.has(cors.id);

              return (
                <div
                  key={cors.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center px-6 py-4">
                    <div className="w-12">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(cors.id, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* Status */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          {cors.enabled ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${
                            cors.enabled 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {cors.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Path */}
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {cors.path}
                        </div>
                        {cors.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {cors.description}
                          </div>
                        )}
                      </div>

                      {/* Origin */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {cors.origin}
                        </div>
                      </div>

                      {/* Methods */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatMethods(cors.method)}
                        </div>
                      </div>

                      {/* Max Age */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {cors.maxAge ? `${cors.maxAge}s` : 'N/A'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEdit?.(cors)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit CORS configuration"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cors)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete CORS configuration"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={deleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDeleteCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                    >
                      Delete CORS Configuration
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete the CORS configuration for{' '}
                        <span className="font-medium">{corsToDelete?.path}</span>?
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3 justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      onClick={handleDeleteCancel}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CorsTable;