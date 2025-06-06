'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Copy, Key, Trash2, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useApiKeys } from './hooks/useApiKeys';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useApiKeyStore } from '@/lib/stores/apiKeyStore';
import { ApiKey, CreateApiKeyRequest, ApiKeyAssignment } from '@/types/security';
import { generateSecureApiKey, copyToClipboard, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

/**
 * API Key Manager Component
 * 
 * Provides comprehensive API key administration interface enabling creation,
 * management, and assignment of API keys to services with secure key generation
 * and intelligent caching functionality.
 * 
 * Features:
 * - Real-time API key listing with SWR caching (cache hits under 50ms)
 * - Secure API key generation using Web Crypto API
 * - Service assignment and management
 * - Permission-based access control
 * - Copy-to-clipboard functionality
 * - Bulk operations support
 * - Responsive design with WCAG 2.1 AA compliance
 * 
 * @implements F-004: API Security Configuration
 * @performance Cache hit responses under 50ms per React/Next.js Integration Requirements
 */
export default function ApiKeyManager() {
  const router = useRouter();
  
  // Zustand state management for API key cache and current service keys
  const {
    selectedServiceId,
    setSelectedServiceId,
    clearCache,
    currentKeys,
    setCurrentKeys
  } = useApiKeyStore();

  // SWR/React Query for intelligent caching and synchronization
  const {
    apiKeys,
    services,
    roles,
    isLoading,
    error,
    mutateApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    assignToService,
    revokeFromService
  } = useApiKeys();

  // Local component state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for API key creation
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    roleId: '',
    expiresAt: '',
    isActive: true,
    permissions: [] as string[]
  });

  // Form state for service assignment
  const [assignForm, setAssignForm] = useState({
    serviceId: '',
    endpoints: [] as string[],
    permissions: [] as string[]
  });

  /**
   * Handle API key creation with secure key generation
   */
  const handleCreateApiKey = useCallback(async () => {
    if (!createForm.name.trim()) {
      setFormError('API key name is required');
      return;
    }

    setIsCreating(true);
    setFormError(null);

    try {
      // Generate secure API key using Web Crypto API
      const apiKey = await generateSecureApiKey();
      
      const request: CreateApiKeyRequest = {
        name: createForm.name,
        description: createForm.description,
        apiKey,
        roleId: createForm.roleId ? parseInt(createForm.roleId) : undefined,
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt) : undefined,
        isActive: createForm.isActive,
        permissions: createForm.permissions
      };

      await createApiKey(request);
      
      // Reset form and close dialog
      setCreateForm({
        name: '',
        description: '',
        roleId: '',
        expiresAt: '',
        isActive: true,
        permissions: []
      });
      setShowCreateDialog(false);
      
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  }, [createForm, createApiKey]);

  /**
   * Handle API key deletion
   */
  const handleDeleteApiKey = useCallback(async () => {
    if (!selectedApiKey) return;

    setIsDeleting(true);
    try {
      await deleteApiKey(selectedApiKey.id);
      setSelectedApiKey(null);
      setShowDeleteDialog(false);
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedApiKey, deleteApiKey]);

  /**
   * Handle service assignment
   */
  const handleAssignToService = useCallback(async () => {
    if (!selectedApiKey || !assignForm.serviceId) return;

    try {
      const assignment: ApiKeyAssignment = {
        apiKeyId: selectedApiKey.id,
        serviceId: parseInt(assignForm.serviceId),
        endpoints: assignForm.endpoints,
        permissions: assignForm.permissions
      };

      await assignToService(assignment);
      
      setAssignForm({
        serviceId: '',
        endpoints: [],
        permissions: []
      });
      setShowAssignDialog(false);
      setSelectedApiKey(null);
      
      toast.success('API key assigned to service successfully');
    } catch (error) {
      console.error('Error assigning API key:', error);
      toast.error('Failed to assign API key to service');
    }
  }, [selectedApiKey, assignForm, assignToService]);

  /**
   * Toggle API key visibility
   */
  const toggleKeyVisibility = useCallback((keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle copy to clipboard
   */
  const handleCopyKey = useCallback(async (apiKey: string) => {
    try {
      await copyToClipboard(apiKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy API key');
    }
  }, []);

  /**
   * Handle bulk selection
   */
  const handleBulkSelect = useCallback((keyId: string, selected: boolean) => {
    setBulkSelection(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(keyId);
      } else {
        newSet.delete(keyId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle bulk deletion
   */
  const handleBulkDelete = useCallback(async () => {
    if (bulkSelection.size === 0) return;

    try {
      await Promise.all(
        Array.from(bulkSelection).map(keyId => deleteApiKey(keyId))
      );
      setBulkSelection(new Set());
      toast.success(`${bulkSelection.size} API keys deleted successfully`);
    } catch (error) {
      console.error('Error deleting API keys:', error);
      toast.error('Failed to delete selected API keys');
    }
  }, [bulkSelection, deleteApiKey]);

  /**
   * Memoized table columns configuration
   */
  const columns = useMemo(() => [
    {
      key: 'select',
      header: (
        <Checkbox
          checked={bulkSelection.size > 0 && bulkSelection.size === apiKeys?.length}
          indeterminate={bulkSelection.size > 0 && bulkSelection.size < (apiKeys?.length || 0)}
          onCheckedChange={(checked) => {
            if (checked) {
              setBulkSelection(new Set(apiKeys?.map(key => key.id) || []));
            } else {
              setBulkSelection(new Set());
            }
          }}
          aria-label="Select all API keys"
        />
      ),
      cell: (item: ApiKey) => (
        <Checkbox
          checked={bulkSelection.has(item.id)}
          onCheckedChange={(checked) => handleBulkSelect(item.id, checked as boolean)}
          aria-label={`Select API key ${item.name}`}
        />
      ),
      width: 50
    },
    {
      key: 'name',
      header: 'Name',
      cell: (item: ApiKey) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {item.name}
          </span>
          {item.description && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {item.description}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'apiKey',
      header: 'API Key',
      cell: (item: ApiKey) => (
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
            {visibleKeys.has(item.id) 
              ? item.apiKey 
              : '•'.repeat(Math.min(item.apiKey.length, 32))
            }
          </code>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleKeyVisibility(item.id)}
                  aria-label={visibleKeys.has(item.id) ? 'Hide API key' : 'Show API key'}
                >
                  {visibleKeys.has(item.id) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {visibleKeys.has(item.id) ? 'Hide API key' : 'Show API key'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyKey(item.apiKey)}
                  aria-label="Copy API key to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: ApiKey) => (
        <div className="flex flex-col gap-1">
          <Badge variant={item.isActive ? 'default' : 'secondary'}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {item.expiresAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Expires: {formatDate(item.expiresAt)}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'services',
      header: 'Assigned Services',
      cell: (item: ApiKey) => (
        <div className="flex flex-wrap gap-1">
          {item.serviceAssignments?.map((assignment) => {
            const service = services?.find(s => s.id === assignment.serviceId);
            return (
              <Badge key={assignment.id} variant="outline" className="text-xs">
                {service?.name || `Service ${assignment.serviceId}`}
              </Badge>
            );
          }) || (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              No services assigned
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: ApiKey) => (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApiKey(item);
                    setShowAssignDialog(true);
                  }}
                  aria-label={`Assign ${item.name} to service`}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Assign to service</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApiKey(item);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete API key</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      width: 120
    }
  ], [
    apiKeys,
    bulkSelection,
    visibleKeys,
    services,
    handleBulkSelect,
    toggleKeyVisibility,
    handleCopyKey
  ]);

  /**
   * Handle refresh action
   */
  const handleRefresh = useCallback(async () => {
    try {
      clearCache();
      await mutateApiKeys();
      toast.success('API keys refreshed');
    } catch (error) {
      console.error('Error refreshing API keys:', error);
      toast.error('Failed to refresh API keys');
    }
  }, [clearCache, mutateApiKeys]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading API keys...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          Error loading API keys: {error.message}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            API Key Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, manage, and assign API keys to services with secure key generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bulkSelection.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({bulkSelection.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Table
          data={apiKeys || []}
          columns={columns}
          emptyMessage="No API keys found. Create your first API key to get started."
          className="rounded-lg"
        />
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a secure API key and configure its permissions and assignments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Name *</Label>
                <Input
                  id="keyName"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="API key name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keyRole">Role</Label>
                <Select
                  value={createForm.roleId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, roleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keyDescription">Description</Label>
              <Input
                id="keyDescription"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyExpires">Expires At</Label>
                <Input
                  id="keyExpires"
                  type="datetime-local"
                  value={createForm.expiresAt}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="keyActive"
                  checked={createForm.isActive}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({ ...prev, isActive: checked as boolean }))
                  }
                />
                <Label htmlFor="keyActive">Active</Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateApiKey}
              disabled={isCreating || !createForm.name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create API Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Service Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign API Key to Service</DialogTitle>
            <DialogDescription>
              Assign "{selectedApiKey?.name}" to a service with specific permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignService">Service</Label>
              <Select
                value={assignForm.serviceId}
                onValueChange={(value) => setAssignForm(prev => ({ ...prev, serviceId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedApiKey(null);
                setAssignForm({
                  serviceId: '',
                  endpoints: [],
                  permissions: []
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignToService}
              disabled={!assignForm.serviceId}
            >
              Assign to Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedApiKey?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedApiKey(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteApiKey}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete API Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}