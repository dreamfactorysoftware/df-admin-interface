'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  PlusIcon, 
  KeyIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useApiKeys } from './hooks/useApiKeys';
import { ApiKeyInfo } from '@/types/security';
import { cn } from '@/lib/utils';

interface ApiKeyManagerProps {
  serviceId: number;
  serviceName?: string;
  className?: string;
}

interface ApiKeyRowProps {
  apiKey: ApiKeyInfo;
  onDelete: (keyName: string) => void;
  onCopy: (key: string) => void;
  isDeleting?: boolean;
}

/**
 * Individual API key row component with visibility toggle and actions
 */
const ApiKeyRow: React.FC<ApiKeyRowProps> = ({ 
  apiKey, 
  onDelete, 
  onCopy, 
  isDeleting = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey.apiKey);
      onCopy(apiKey.apiKey);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  }, [apiKey.apiKey, onCopy]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete the API key "${apiKey.name}"?`)) {
      onDelete(apiKey.name);
    }
  }, [apiKey.name, onDelete]);

  const maskedKey = useMemo(() => {
    const key = apiKey.apiKey;
    if (isVisible || key.length < 8) return key;
    return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
  }, [apiKey.apiKey, isVisible]);

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <KeyIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
            <div className="text-sm text-gray-500">API Key</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
            {maskedKey}
          </code>
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title={isVisible ? 'Hide key' : 'Show key'}
          >
            {isVisible ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={copied}
            className={cn(
              "inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded",
              "transition-colors duration-150",
              copied
                ? "text-green-700 bg-green-100 hover:bg-green-200"
                : "text-blue-700 bg-blue-100 hover:bg-blue-200"
            )}
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <ClipboardIcon className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              "inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded",
              "text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-150",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * API Key Manager Component
 * 
 * React component for API key administration interface, enabling creation, 
 * management, and assignment of API keys to services with secure key generation 
 * and caching functionality. Replaces Angular API keys service with React 
 * Query-powered data management.
 * 
 * Features:
 * - Real-time API key listing with intelligent caching via React Query
 * - Secure API key generation and management via Next.js serverless endpoints
 * - Zustand state management for API key cache and current service keys
 * - Responsive design with Tailwind CSS and accessibility compliance
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @param serviceId - The database service ID to manage API keys for
 * @param serviceName - Optional service name for display purposes
 * @param className - Additional CSS classes for styling
 */
export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  serviceId,
  serviceName,
  className
}) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Use React Query for intelligent caching with cache hit responses under 50ms
  const {
    data: apiKeys = [],
    isLoading,
    isError,
    error,
    refetch,
    invalidateCache
  } = useApiKeys(serviceId);

  /**
   * Handle API key creation via Next.js serverless endpoint
   */
  const handleCreateApiKey = useCallback(async () => {
    if (serviceId === -1) {
      toast.error('Please select a service first');
      return;
    }

    const keyName = window.prompt('Enter a name for the new API key:');
    if (!keyName?.trim()) return;

    setIsCreating(true);
    try {
      // Create via Next.js API route for secure server-side handling
      const response = await fetch('/api/security/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include secure session cookies
        body: JSON.stringify({
          serviceId,
          keyName: keyName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create API key');
      }

      const newKey = await response.json();
      
      // Optimistically update cache and trigger refetch
      queryClient.setQueryData(['apiKeys', serviceId], (old: ApiKeyInfo[] = []) => [
        ...old,
        newKey
      ]);

      toast.success(`API key "${keyName}" created successfully`);
      
      // Invalidate cache to ensure consistency
      await invalidateCache();
      
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  }, [serviceId, queryClient, invalidateCache]);

  /**
   * Handle API key deletion with optimistic updates
   */
  const handleDeleteApiKey = useCallback(async (keyName: string) => {
    setDeletingKey(keyName);
    
    try {
      // Delete via Next.js API route
      const response = await fetch('/api/security/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId,
          keyName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete API key');
      }

      // Optimistically update cache
      queryClient.setQueryData(['apiKeys', serviceId], (old: ApiKeyInfo[] = []) =>
        old.filter(key => key.name !== keyName)
      );

      toast.success(`API key "${keyName}" deleted successfully`);
      
      // Invalidate cache to ensure consistency
      await invalidateCache();
      
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete API key');
    } finally {
      setDeletingKey(null);
    }
  }, [serviceId, queryClient, invalidateCache]);

  /**
   * Handle API key copy with analytics tracking
   */
  const handleCopyApiKey = useCallback((key: string) => {
    // Track usage for analytics (optional)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'api_key_copied', {
        service_id: serviceId,
      });
    }
  }, [serviceId]);

  /**
   * Handle cache refresh
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('API keys refreshed');
    } catch (error) {
      toast.error('Failed to refresh API keys');
    }
  }, [refetch]);

  // Early return for invalid service
  if (serviceId === -1) {
    return (
      <div className={cn(
        "bg-white shadow rounded-lg border border-gray-200 p-6",
        className
      )}>
        <div className="text-center py-8">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Service Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a database service to manage its API keys.
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (isError) {
    return (
      <div className={cn(
        "bg-white shadow rounded-lg border border-red-200 p-6",
        className
      )}>
        <div className="text-center py-8">
          <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
            <KeyIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Failed to Load API Keys
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white shadow rounded-lg border border-gray-200",
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage API keys for {serviceName || `Service ${serviceId}`}
              {apiKeys.length > 0 && ` (${apiKeys.length} key${apiKeys.length === 1 ? '' : 's'})`}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCreateApiKey}
              disabled={isCreating || isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {isCreating ? 'Creating...' : 'Create API Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {isLoading ? (
          // Loading state
          <div className="px-6 py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading API keys...</p>
            </div>
          </div>
        ) : apiKeys.length === 0 ? (
          // Empty state
          <div className="px-6 py-12">
            <div className="text-center">
              <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No API Keys</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first API key for this service.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreateApiKey}
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Create API Key'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // API keys table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    API Key
                  </th>
                  <th
                    scope="col"
                    className="relative px-6 py-3"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((apiKey) => (
                  <ApiKeyRow
                    key={`${apiKey.name}-${apiKey.apiKey}`}
                    apiKey={apiKey}
                    onDelete={handleDeleteApiKey}
                    onCopy={handleCopyApiKey}
                    isDeleting={deletingKey === apiKey.name}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeyManager;