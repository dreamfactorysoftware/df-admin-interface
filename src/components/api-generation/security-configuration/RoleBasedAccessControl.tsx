'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  TrashIcon,
  ShieldCheckIcon,
  UsersIcon
} from 'lucide-react';

// Type definitions based on Angular service structure
interface RoleServiceAccess {
  serviceId: number;
  roleId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters: Array<{
    name: string;
    operator: string;
    value: string;
  }>;
  filterOp: string;
  id?: number;
}

interface Role {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  lookupByRoleId?: Array<{
    name: string;
    value: string;
    private: boolean;
  }>;
  createdDate?: string;
  lastModifiedDate?: string;
  createdById?: number;
  lastModifiedById?: number;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
}

interface Component {
  name: string;
  description?: string;
}

// Validation schema
const roleServiceAccessSchema = z.object({
  serviceId: z.number().min(1, 'Service is required'),
  component: z.string().min(1, 'Component is required'),
  verbMask: z.number().min(0),
  requestorMask: z.number().min(0),
  filters: z.array(z.object({
    name: z.string(),
    operator: z.string(),
    value: z.string()
  })).default([]),
  filterOp: z.enum(['AND', 'OR']).default('AND')
});

const roleFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Role name is required').max(255, 'Role name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
  roleServiceAccessByRoleId: z.array(roleServiceAccessSchema).default([]),
  lookupByRoleId: z.array(z.object({
    name: z.string(),
    value: z.string(),
    private: z.boolean().default(false)
  })).default([])
});

type RoleFormData = z.infer<typeof roleFormSchema>;

// HTTP verb constants
const HTTP_VERBS = {
  GET: 1,
  POST: 2,
  PUT: 4,
  PATCH: 8,
  DELETE: 16
} as const;

const VERB_LABELS = {
  [HTTP_VERBS.GET]: 'Read',
  [HTTP_VERBS.POST]: 'Create',
  [HTTP_VERBS.PUT]: 'Update',
  [HTTP_VERBS.PATCH]: 'Patch',
  [HTTP_VERBS.DELETE]: 'Delete'
} as const;

// Requestor mask constants
const REQUESTOR_TYPES = {
  API_KEY: 1,
  SESSION_TOKEN: 2,
  BASIC_AUTH: 4,
  JWT: 8
} as const;

const REQUESTOR_LABELS = {
  [REQUESTOR_TYPES.API_KEY]: 'API Key',
  [REQUESTOR_TYPES.SESSION_TOKEN]: 'Session Token',
  [REQUESTOR_TYPES.BASIC_AUTH]: 'Basic Auth',
  [REQUESTOR_TYPES.JWT]: 'JWT'
} as const;

// Mock hooks - these should be implemented separately
const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<{ resource: Role[] }> => {
      // This would call the actual API
      const response = await fetch('/api/v2/system/role?related=role_service_access_by_role_id,lookup_by_role_id');
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache per requirements
  });
};

const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<{ resource: Service[] }> => {
      const response = await fetch('/api/v2/system/service?fields=*');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

const useComponents = (serviceId: number) => {
  return useQuery({
    queryKey: ['components', serviceId],
    queryFn: async (): Promise<{ resource: Component[] }> => {
      if (!serviceId) return { resource: [] };
      const response = await fetch(`/api/v2/${serviceId}/_schema`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json();
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
};

interface RoleBasedAccessControlProps {
  roleId?: number;
  onSave?: (role: Role) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  roleId,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Fetch data
  const { data: rolesData } = useRoles();
  const { data: servicesData } = useServices();

  // Get specific role if editing
  const existingRole = useMemo(() => {
    if (!roleId || !rolesData?.resource) return null;
    return rolesData.resource.find(role => role.id === roleId) || null;
  }, [roleId, rolesData]);

  // Form setup
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: existingRole || {
      name: '',
      description: '',
      isActive: true,
      roleServiceAccessByRoleId: [],
      lookupByRoleId: []
    }
  });

  const { fields: serviceAccessFields, append: appendServiceAccess, remove: removeServiceAccess } = useFieldArray({
    control: form.control,
    name: 'roleServiceAccessByRoleId'
  });

  const { fields: lookupFields, append: appendLookup, remove: removeLookup } = useFieldArray({
    control: form.control,
    name: 'lookupByRoleId'
  });

  // Mutations
  const saveRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData): Promise<Role> => {
      const url = roleId ? `/api/v2/system/role/${roleId}` : '/api/v2/system/role';
      const method = roleId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${roleId ? 'update' : 'create'} role`);
      }
      
      return response.json();
    },
    onSuccess: (savedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSave?.(savedRole);
    }
  });

  // Utility functions
  const isBitSet = (mask: number, bit: number): boolean => (mask & bit) === bit;
  
  const toggleBit = (mask: number, bit: number): number => {
    return isBitSet(mask, bit) ? mask & ~bit : mask | bit;
  };

  const toggleRowExpansion = useCallback((index: number) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  }, []);

  const addServiceAccess = useCallback(() => {
    appendServiceAccess({
      serviceId: 0,
      component: '',
      verbMask: 0,
      requestorMask: 0,
      filters: [],
      filterOp: 'AND'
    });
  }, [appendServiceAccess]);

  const addLookupKey = useCallback(() => {
    appendLookup({
      name: '',
      value: '',
      private: false
    });
  }, [appendLookup]);

  const handleSubmit = useCallback((data: RoleFormData) => {
    if (!readOnly) {
      saveRoleMutation.mutate(data);
    }
  }, [saveRoleMutation, readOnly]);

  const ServiceAccessRow: React.FC<{ index: number }> = ({ index }) => {
    const serviceId = form.watch(`roleServiceAccessByRoleId.${index}.serviceId`);
    const { data: componentsData } = useComponents(serviceId);
    const isExpanded = expandedRows.has(index);

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
        {/* Header Row */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <button
              type="button"
              onClick={() => toggleRowExpansion(index)}
              className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>

            {/* Service Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service
              </label>
              <select
                {...form.register(`roleServiceAccessByRoleId.${index}.serviceId`, { valueAsNumber: true })}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={0}>Select a service...</option>
                {servicesData?.resource?.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Component Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component
              </label>
              <select
                {...form.register(`roleServiceAccessByRoleId.${index}.component`)}
                disabled={readOnly || !serviceId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              >
                <option value="">Select a component...</option>
                <option value="*">All Components</option>
                {componentsData?.resource?.map(component => (
                  <option key={component.name} value={component.name}>
                    {component.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => removeServiceAccess(index)}
              className="ml-4 p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              title="Remove service access"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* HTTP Verbs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Allowed Operations
                </label>
                <div className="space-y-2">
                  {Object.entries(VERB_LABELS).map(([verbValue, label]) => {
                    const currentMask = form.watch(`roleServiceAccessByRoleId.${index}.verbMask`) || 0;
                    const isChecked = isBitSet(currentMask, parseInt(verbValue));
                    
                    return (
                      <label key={verbValue} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={readOnly}
                          onChange={() => {
                            const newMask = toggleBit(currentMask, parseInt(verbValue));
                            form.setValue(`roleServiceAccessByRoleId.${index}.verbMask`, newMask);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Requestor Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Authentication Methods
                </label>
                <div className="space-y-2">
                  {Object.entries(REQUESTOR_LABELS).map(([requestorValue, label]) => {
                    const currentMask = form.watch(`roleServiceAccessByRoleId.${index}.requestorMask`) || 0;
                    const isChecked = isBitSet(currentMask, parseInt(requestorValue));
                    
                    return (
                      <label key={requestorValue} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={readOnly}
                          onChange={() => {
                            const newMask = toggleBit(currentMask, parseInt(requestorValue));
                            form.setValue(`roleServiceAccessByRoleId.${index}.requestorMask`, newMask);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Operations */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Advanced Filters
                </label>
                <select
                  {...form.register(`roleServiceAccessByRoleId.${index}.filterOp`)}
                  disabled={readOnly}
                  className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Advanced filter configuration would be implemented here with dynamic field addition
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {roleId ? 'Edit Role' : 'Create Role'}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure role-based access controls for API endpoints and services. 
          Define granular permissions and authentication requirements.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name *
              </label>
              <input
                {...form.register('name')}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                placeholder="Enter role name"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  {...form.register('isActive')}
                  type="checkbox"
                  disabled={readOnly}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active Role
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...form.register('description')}
              disabled={readOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              placeholder="Enter role description"
            />
            {form.formState.errors.description && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Service Access Configuration */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Service Access Configuration
            </h2>
            {!readOnly && (
              <button
                type="button"
                onClick={addServiceAccess}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Service Access
              </button>
            )}
          </div>

          {serviceAccessFields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No service access configured
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add service access rules to control API endpoint permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceAccessFields.map((field, index) => (
                <ServiceAccessRow key={field.id} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Lookup Keys */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Lookup Keys
            </h2>
            {!readOnly && (
              <button
                type="button"
                onClick={addLookupKey}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Lookup Key
              </button>
            )}
          </div>

          {lookupFields.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No lookup keys configured for this role.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lookupFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <input
                    {...form.register(`lookupByRoleId.${index}.name`)}
                    disabled={readOnly}
                    placeholder="Key name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    {...form.register(`lookupByRoleId.${index}.value`)}
                    disabled={readOnly}
                    placeholder="Key value"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <label className="flex items-center">
                    <input
                      {...form.register(`lookupByRoleId.${index}.private`)}
                      type="checkbox"
                      disabled={readOnly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Private</span>
                  </label>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeLookup(index)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saveRoleMutation.isPending}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveRoleMutation.isPending ? 'Saving...' : (roleId ? 'Update Role' : 'Create Role')}
            </button>
          </div>
        )}
      </form>

      {/* Error Display */}
      {saveRoleMutation.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {saveRoleMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleBasedAccessControl;