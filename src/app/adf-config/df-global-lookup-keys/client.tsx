/**
 * Global Lookup Keys Client Component
 * 
 * Client-side component that handles interactive functionality for global lookup keys
 * management. Implements SWR/React Query for data fetching, form management with
 * React Hook Form, and real-time updates. This component is rendered on the client
 * side after the initial SSR to provide interactivity.
 * 
 * @fileoverview Global lookup keys client component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { AlertCircle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { useLookupKeys, type LookupKey, type CreateLookupKeyData, type UpdateLookupKeyData } from './use-lookup-keys';
import LookupKeysForm from './lookup-keys-form';

// ============================================================================
// Type Definitions
// ============================================================================

interface LookupKeysClientProps {
  /** Initial data from server-side rendering (optional) */
  initialData?: LookupKey[];
  /** Custom class name for styling */
  className?: string;
}

// ============================================================================
// Client Component Implementation
// ============================================================================

/**
 * Global Lookup Keys Client Component
 * 
 * Handles all client-side functionality including:
 * - Data fetching with SWR/React Query
 * - Form state management
 * - Real-time updates and caching
 * - Error handling and retry logic
 * - Optimistic updates for better UX
 */
export function GlobalLookupKeysClient({ 
  initialData = [], 
  className = '' 
}: LookupKeysClientProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // ============================================================================
  // Data Fetching with SWR/React Query
  // ============================================================================

  const {
    data: lookupKeys,
    isLoading,
    isFetching,
    error,
    refresh,
    createAsync,
    updateAsync,
    deleteAsync,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  } = useLookupKeys(
    // Query parameters for optimization
    {
      fields: 'id,name,value,description,is_active,created_date,last_modified_date',
      sort: 'name',
      include_count: true,
    },
    // Hook options for performance
    {
      enableSWR: true,
      enableOptimistic: true,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 3,
    }
  );

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isPerformingMutation = isCreating || isUpdating || isDeleting;
  const hasError = error || createError || updateError || deleteError;
  const currentError = error || createError || updateError || deleteError;

  // Transform API data format to form format
  const formattedData = useMemo(() => {
    return lookupKeys.map((key: LookupKey) => ({
      id: key.id,
      name: key.name,
      value: key.value,
      private: !key.is_active, // Transform is_active to private flag
      description: key.description || '',
      created_date: key.created_date,
      last_modified_date: key.last_modified_date,
      created_by_id: key.created_by_id,
      last_modified_by_id: key.last_modified_by_id,
    }));
  }, [lookupKeys]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle saving lookup keys with optimistic updates and error recovery
   */
  const handleSave = useCallback(async (
    createKeys: Array<Omit<LookupKey, 'id'>>, 
    updateKeys: LookupKey[]
  ) => {
    setSaveStatus('saving');
    
    try {
      const savePromises: Promise<any>[] = [];

      // Process create operations
      if (createKeys.length > 0) {
        const createPromises = createKeys.map(async (key) => {
          const createData: CreateLookupKeyData = {
            name: key.name,
            value: key.value,
            description: key.description || undefined,
            is_active: !key.private, // Transform private flag to is_active
          };
          return createAsync(createData);
        });
        savePromises.push(...createPromises);
      }

      // Process update operations  
      if (updateKeys.length > 0) {
        const updatePromises = updateKeys.map(async (key) => {
          const updateData: UpdateLookupKeyData = {
            name: key.name,
            value: key.value,
            description: key.description || undefined,
            is_active: !key.private, // Transform private flag to is_active
          };
          return updateAsync({ id: key.id!, data: updateData });
        });
        savePromises.push(...updatePromises);
      }

      // Execute all save operations
      await Promise.all(savePromises);

      // Update save status and timestamp
      setSaveStatus('success');
      setLastSaveTime(new Date());

      // Auto-reset status after delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Failed to save lookup keys:', error);
      setSaveStatus('error');
      
      // Auto-reset error status after delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
      
      // Re-throw error so form can handle it
      throw error;
    }
  }, [createAsync, updateAsync]);

  /**
   * Handle manual refresh of data
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh lookup keys:', error);
    }
  }, [refresh]);

  // ============================================================================
  // Effect Hooks
  // ============================================================================

  /**
   * Handle keyboard shortcuts for power users
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R for refresh (prevent default browser refresh)
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh]);

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (isLoading && !lookupKeys.length) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading lookup keys configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render Error State
  // ============================================================================

  if (hasError && !lookupKeys.length) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Failed to Load Lookup Keys
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {currentError?.message || 'An unexpected error occurred while loading the lookup keys.'}
              </p>
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="inline-flex items-center space-x-2 text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render Success State
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status indicator */}
      {(isFetching || isPerformingMutation || saveStatus !== 'idle') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {(isFetching || isPerformingMutation || saveStatus === 'saving') && (
              <>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {isFetching && !isPerformingMutation ? 'Refreshing lookup keys...' :
                   saveStatus === 'saving' || isPerformingMutation ? 'Saving changes...' :
                   'Processing...'}
                </div>
              </>
            )}
            
            {saveStatus === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  Lookup keys saved successfully
                  {lastSaveTime && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      at {lastSaveTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </>
            )}
            
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  Failed to save changes. Please try again.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {lookupKeys.length === 0 ? (
              'No lookup keys configured'
            ) : lookupKeys.length === 1 ? (
              '1 lookup key'
            ) : (
              `${lookupKeys.length} lookup keys`
            )}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center space-x-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Refresh lookup keys from server"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main form component */}
      <LookupKeysForm
        initialData={formattedData}
        onSave={handleSave}
        isLoading={isPerformingMutation}
        className="w-full"
      />

      {/* Error messages for specific operations */}
      {hasError && lookupKeys.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Operation Error</p>
              <p>{currentError?.message || 'An error occurred during the last operation.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <span>
              Data source: {isFetching ? 'Server (refreshing)' : 'Cache'}
            </span>
            <span>
              Last updated: {lastSaveTime ? lastSaveTime.toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        {isFetching && 'Refreshing lookup keys data'}
        {isPerformingMutation && 'Saving lookup keys changes'}
        {saveStatus === 'success' && 'Lookup keys saved successfully'}
        {saveStatus === 'error' && 'Failed to save lookup keys'}
      </div>
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default GlobalLookupKeysClient;