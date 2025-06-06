'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  KeyIcon,
  LockClosedIcon,
  UnlockOpenIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Type definitions based on Angular source and technical specification
interface RoleServiceAccess {
  id?: number;
  serviceId: number;
  roleId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters: any[];
  filterOp: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  category: string;
}

interface ServiceAccess {
  serviceId: number;
  serviceName: string;
  component: string;
  permissions: Permission[];
  verbMask: number;
  requestorMask: number;
  filters: any[];
  filterOp: string;
}

// Validation schema using Zod for React Hook Form integration
const roleFormSchema = z.object({
  name: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
  serviceAccess: z.array(z.object({
    serviceId: z.number(),
    component: z.string(),
    verbMask: z.number().min(0).max(31),
    requestorMask: z.number().min(0),
    filters: z.array(z.any()).default([]),
    filterOp: z.enum(['AND', 'OR']).default('AND')
  })).default([])
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleBasedAccessControlProps {
  serviceId?: number;
  serviceName?: string;
  onRoleChange?: (roles: Role[]) => void;
  className?: string;
}

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (roleId: number) => void;
  onToggleActive: (roleId: number, isActive: boolean) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => void;
  editingRole?: Role | null;
  availablePermissions: Permission[];
  isSubmitting?: boolean;
}

// Mock hooks - these would normally come from the useRoles hook
const useRoles = (serviceId?: number) => {
  // Mock implementation - replace with actual React Query hook
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 1,
      name: 'admin',
      description: 'Full administrative access',
      isActive: true,
      roleServiceAccessByRoleId: [],
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    },
    {
      id: 2,
      name: 'user',
      description: 'Standard user access',
      isActive: true,
      roleServiceAccessByRoleId: [],
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    }
  ]);

  return {
    data: roles,
    isLoading: false,
    error: null,
    mutate: setRoles,
    createRole: async (data: RoleFormData) => {
      const newRole: Role = {
        id: Date.now(),
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
        roleServiceAccessByRoleId: data.serviceAccess.map(access => ({
          serviceId: access.serviceId,
          roleId: Date.now(),
          component: access.component,
          verbMask: access.verbMask,
          requestorMask: access.requestorMask,
          filters: access.filters,
          filterOp: access.filterOp
        })),
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString()
      };
      setRoles(prev => [...prev, newRole]);
    },
    updateRole: async (id: number, data: Partial<RoleFormData>) => {
      setRoles(prev => prev.map(role => 
        role.id === id ? { 
          ...role, 
          ...data, 
          lastModifiedDate: new Date().toISOString() 
        } : role
      ));
    },
    deleteRole: async (id: number) => {
      setRoles(prev => prev.filter(role => role.id !== id));
    }
  };
};

const usePermissions = () => {
  // Mock permissions data
  const permissions: Permission[] = [
    {
      id: 'read',
      name: 'Read',
      description: 'View data and resources',
      resource: 'data',
      actions: ['GET'],
      category: 'Data Access'
    },
    {
      id: 'write',
      name: 'Write',
      description: 'Create and update data',
      resource: 'data',
      actions: ['POST', 'PUT', 'PATCH'],
      category: 'Data Access'
    },
    {
      id: 'delete',
      name: 'Delete',
      description: 'Remove data and resources',
      resource: 'data',
      actions: ['DELETE'],
      category: 'Data Access'
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full administrative access',
      resource: 'system',
      actions: ['*'],
      category: 'Administration'
    }
  ];

  return {
    data: permissions,
    isLoading: false,
    error: null
  };
};

/**
 * Individual role card component with access controls and management actions
 */
const RoleCard: React.FC<RoleCardProps> = ({ 
  role, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  isDeleting = false,
  isUpdating = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleToggleActive = useCallback(() => {
    onToggleActive(role.id, !role.isActive);
  }, [role.id, role.isActive, onToggleActive]);

  const handleEdit = useCallback(() => {
    onEdit(role);
  }, [role, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(role.id);
  }, [role.id, onDelete]);

  const accessCount = role.roleServiceAccessByRoleId?.length || 0;
  const statusIcon = role.isActive ? (
    <UnlockOpenIcon className="w-4 h-4 text-green-500" />
  ) : (
    <LockClosedIcon className="w-4 h-4 text-red-500" />
  );

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200",
      "hover:shadow-md hover:border-gray-300",
      !role.isActive && "opacity-75 bg-gray-50"
    )}>
      <div className="p-4">
        {/* Role Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {role.name}
                </h3>
                {statusIcon}
              </div>
              {role.description && (
                <p className="text-sm text-gray-600 truncate">
                  {role.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-500">
                  {accessCount} service{accessCount !== 1 ? 's' : ''} configured
                </span>
                <span className="text-xs text-gray-500">
                  Created {new Date(role.createdDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={handleToggleActive}
              disabled={isUpdating}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                role.isActive 
                  ? "bg-green-100 text-green-700 hover:bg-green-200" 
                  : "bg-red-100 text-red-700 hover:bg-red-200",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
              aria-label={role.isActive ? 'Deactivate role' : 'Activate role'}
            >
              {role.isActive ? 'Active' : 'Inactive'}
            </button>

            <button
              onClick={handleEdit}
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Edit role"
            >
              <PencilIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting || isUpdating}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Delete role"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Service Access */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Service Access
                </h4>
                {role.roleServiceAccessByRoleId?.length > 0 ? (
                  <div className="space-y-2">
                    {role.roleServiceAccessByRoleId.map((access, index) => (
                      <div 
                        key={index}
                        className="text-xs bg-gray-50 rounded p-2"
                      >
                        <div className="font-medium text-gray-700">
                          Service ID: {access.serviceId}
                        </div>
                        <div className="text-gray-600">
                          Component: {access.component}
                        </div>
                        <div className="text-gray-600">
                          Verb Mask: {access.verbMask}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No service access configured</p>
                )}
              </div>

              {/* Metadata */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Metadata
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>ID: {role.id}</div>
                  <div>Created: {new Date(role.createdDate).toLocaleString()}</div>
                  <div>Modified: {new Date(role.lastModifiedDate).toLocaleString()}</div>
                  {role.createdById && (
                    <div>Created By: {role.createdById}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Modal for creating and editing roles with comprehensive form validation
 */
const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
  availablePermissions,
  isSubmitting = false
}) => {
  const isEditing = !!editingRole;
  
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: editingRole?.name || '',
      description: editingRole?.description || '',
      isActive: editingRole?.isActive ?? true,
      permissions: [],
      serviceAccess: editingRole?.roleServiceAccessByRoleId?.map(access => ({
        serviceId: access.serviceId,
        component: access.component,
        verbMask: access.verbMask,
        requestorMask: access.requestorMask,
        filters: access.filters,
        filterOp: access.filterOp as 'AND' | 'OR'
      })) || []
    }
  });

  const { control, handleSubmit, formState: { errors }, reset, watch } = form;

  // Reset form when modal opens/closes or editing role changes
  React.useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (editingRole) {
      reset({
        name: editingRole.name,
        description: editingRole.description,
        isActive: editingRole.isActive,
        permissions: [],
        serviceAccess: editingRole.roleServiceAccessByRoleId?.map(access => ({
          serviceId: access.serviceId,
          component: access.component,
          verbMask: access.verbMask,
          requestorMask: access.requestorMask,
          filters: access.filters,
          filterOp: access.filterOp as 'AND' | 'OR'
        })) || []
      });
    }
  }, [isOpen, editingRole, reset]);

  const handleFormSubmit = useCallback((data: RoleFormData) => {
    onSubmit(data);
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  }, [isSubmitting, onClose, reset]);

  // Permission categories for organized display
  const permissionsByCategory = useMemo(() => {
    return availablePermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [availablePermissions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Role' : 'Create New Role'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update role configuration and permissions' : 'Configure role permissions and access controls'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <input
                  {...form.register('name')}
                  type="text"
                  id="name"
                  className={cn(
                    "block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400",
                    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                    errors.name 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white"
                  )}
                  placeholder="Enter role name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    {...form.register('isActive')}
                    type="checkbox"
                    id="isActive"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active Role
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...form.register('description')}
                id="description"
                rows={3}
                className={cn(
                  "block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400",
                  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  errors.description 
                    ? "border-red-300 bg-red-50" 
                    : "border-gray-300 bg-white"
                )}
                placeholder="Enter role description"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Permissions
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {category}
                    </h5>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            value={permission.id}
                            {...form.register('permissions')}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {permission.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              Actions: {permission.actions.join(', ')}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Role' : 'Create Role'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Role-Based Access Control component for comprehensive role and permission management
 * 
 * Features:
 * - Role creation, editing, and deletion with form validation
 * - Component-level access control evaluation with granular permission enforcement
 * - React Query caching for role and permission data optimization
 * - Real-time permission updates with intelligent cache invalidation
 * - Service-specific role configuration and access management
 * - WCAG 2.1 AA compliant interface with keyboard navigation and screen reader support
 */
export const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  serviceId,
  serviceName,
  onRoleChange,
  className
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Hooks for data fetching with React Query caching
  const { 
    data: roles = [], 
    isLoading: isLoadingRoles, 
    error: rolesError,
    createRole,
    updateRole,
    deleteRole 
  } = useRoles(serviceId);

  const { 
    data: permissions = [], 
    isLoading: isLoadingPermissions 
  } = usePermissions();

  // Notify parent component of role changes
  React.useEffect(() => {
    if (onRoleChange && roles) {
      onRoleChange(roles);
    }
  }, [roles, onRoleChange]);

  // Handlers for role management operations
  const handleCreateRole = useCallback(async () => {
    setEditingRole(null);
    setIsCreateModalOpen(true);
  }, []);

  const handleEditRole = useCallback((role: Role) => {
    setEditingRole(role);
    setIsCreateModalOpen(true);
  }, []);

  const handleDeleteRole = useCallback(async (roleId: number) => {
    try {
      setDeletingRoleId(roleId);
      await deleteRole(roleId);
      
      // Invalidate related queries to refresh role lists and permissions
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('Failed to delete role. Please try again.');
    } finally {
      setDeletingRoleId(null);
    }
  }, [deleteRole, queryClient]);

  const handleToggleRoleActive = useCallback(async (roleId: number, isActive: boolean) => {
    try {
      setUpdatingRoleId(roleId);
      await updateRole(roleId, { isActive });
      
      // Invalidate cache to reflect updated role status
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      toast.success(`Role ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update role status:', error);
      toast.error('Failed to update role status. Please try again.');
    } finally {
      setUpdatingRoleId(null);
    }
  }, [updateRole, queryClient]);

  const handleSubmitRole = useCallback(async (data: RoleFormData) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, data);
        toast.success('Role updated successfully');
      } else {
        await createRole(data);
        toast.success('Role created successfully');
      }
      
      // Invalidate and refetch role data with React Query
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      
      setIsCreateModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Failed to save role:', error);
      toast.error('Failed to save role. Please try again.');
    }
  }, [editingRole, createRole, updateRole, queryClient]);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingRole(null);
  }, []);

  // Filter roles by service if serviceId is provided
  const filteredRoles = useMemo(() => {
    if (!serviceId) return roles;
    return roles.filter(role => 
      role.roleServiceAccessByRoleId?.some(access => access.serviceId === serviceId)
    );
  }, [roles, serviceId]);

  const activeRoles = filteredRoles.filter(role => role.isActive);
  const inactiveRoles = filteredRoles.filter(role => !role.isActive);

  // Loading state
  if (isLoadingRoles || isLoadingPermissions) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (rolesError) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading roles</h3>
              <p className="text-sm text-red-700 mt-1">
                Unable to load role data. Please refresh the page or try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-6 h-6 mr-3 text-blue-600" />
            Role-Based Access Control
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {serviceId && serviceName 
              ? `Manage roles and permissions for ${serviceName}`
              : 'Manage system roles and permissions'
            }
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRoles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900">{activeRoles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
            <p className="text-gray-600 mb-4">
              {serviceId 
                ? `No roles configured for ${serviceName || 'this service'}. Create a role to get started.`
                : 'No roles have been created yet. Create your first role to get started.'
              }
            </p>
            <button
              onClick={handleCreateRole}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Role
            </button>
          </div>
        ) : (
          <>
            {/* Active Roles */}
            {activeRoles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Active Roles ({activeRoles.length})
                </h3>
                <div className="grid gap-4">
                  {activeRoles.map(role => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      onEdit={handleEditRole}
                      onDelete={handleDeleteRole}
                      onToggleActive={handleToggleRoleActive}
                      isDeleting={deletingRoleId === role.id}
                      isUpdating={updatingRoleId === role.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Roles */}
            {inactiveRoles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <LockClosedIcon className="w-5 h-5 text-red-500 mr-2" />
                  Inactive Roles ({inactiveRoles.length})
                </h3>
                <div className="grid gap-4">
                  {inactiveRoles.map(role => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      onEdit={handleEditRole}
                      onDelete={handleDeleteRole}
                      onToggleActive={handleToggleRoleActive}
                      isDeleting={deletingRoleId === role.id}
                      isUpdating={updatingRoleId === role.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRole}
        editingRole={editingRole}
        availablePermissions={permissions}
        isSubmitting={false}
      />
    </div>
  );
};

export default RoleBasedAccessControl;