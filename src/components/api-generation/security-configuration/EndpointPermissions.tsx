'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDownIcon, ChevronRightIcon, LockClosedIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Type definitions - these would normally be imported from the dependencies
interface HttpMethod {
  value: number;
  label: string;
  description: string;
}

interface RequestorType {
  value: number;
  label: string;
  description: string;
}

interface EndpointPermission {
  id?: string;
  serviceId: number;
  roleId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters: EndpointFilter[];
  filterOp: 'AND' | 'OR';
  isActive: boolean;
}

interface EndpointFilter {
  id?: string;
  field: string;
  operator: FilterOperator;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'is_null' | 'is_not_null';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Mock Badge component (would normally be imported)
const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className 
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

// Mock FormField component (would normally be imported)
const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  required, 
  children, 
  className 
}) => {
  return (
    <div className={clsx('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// Validation schema using Zod
const endpointFilterSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'in', 'not_in', 'is_null', 'is_not_null']),
  value: z.string().min(1, 'Value is required'),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});

const endpointPermissionSchema = z.object({
  serviceId: z.number().min(1, 'Service is required'),
  roleId: z.number().min(1, 'Role is required'),
  component: z.string().min(1, 'Component/endpoint is required'),
  verbMask: z.number().min(0, 'At least one HTTP method must be selected'),
  requestorMask: z.number().min(0, 'At least one requestor type must be selected'),
  filters: z.array(endpointFilterSchema).default([]),
  filterOp: z.enum(['AND', 'OR']).default('AND'),
  isActive: z.boolean().default(true),
});

type EndpointPermissionFormData = z.infer<typeof endpointPermissionSchema>;

interface EndpointPermissionsProps {
  serviceId?: number;
  permissions?: EndpointPermission[];
  onSave?: (permissions: EndpointPermission[]) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

// HTTP Methods configuration with bitmask values
const HTTP_METHODS: HttpMethod[] = [
  { value: 1, label: 'GET', description: 'Read operations - retrieve data' },
  { value: 2, label: 'POST', description: 'Create operations - add new data' },
  { value: 4, label: 'PUT', description: 'Update operations - replace existing data' },
  { value: 8, label: 'PATCH', description: 'Partial update operations - modify specific fields' },
  { value: 16, label: 'DELETE', description: 'Delete operations - remove data' },
];

// Requestor types configuration with bitmask values
const REQUESTOR_TYPES: RequestorType[] = [
  { value: 1, label: 'Admin', description: 'Administrative users with full access' },
  { value: 2, label: 'User', description: 'Regular authenticated users' },
  { value: 4, label: 'Guest', description: 'Unauthenticated public access' },
  { value: 8, label: 'API Key', description: 'Application-to-application access' },
  { value: 16, label: 'OAuth', description: 'OAuth authenticated access' },
];

// Filter operators configuration
const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
] as const;

export const EndpointPermissions: React.FC<EndpointPermissionsProps> = ({
  serviceId,
  permissions = [],
  onSave,
  onCancel,
  className,
}) => {
  const [expandedPermissions, setExpandedPermissions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
  } = useForm<{ permissions: EndpointPermissionFormData[] }>({
    resolver: zodResolver(z.object({
      permissions: z.array(endpointPermissionSchema).min(1, 'At least one permission rule is required'),
    })),
    defaultValues: {
      permissions: permissions.length > 0 
        ? permissions.map(p => ({
            serviceId: p.serviceId,
            roleId: p.roleId,
            component: p.component,
            verbMask: p.verbMask,
            requestorMask: p.requestorMask,
            filters: p.filters,
            filterOp: p.filterOp,
            isActive: p.isActive,
          }))
        : [{
            serviceId: serviceId || 0,
            roleId: 0,
            component: '',
            verbMask: 0,
            requestorMask: 0,
            filters: [],
            filterOp: 'AND' as const,
            isActive: true,
          }],
    },
    mode: 'onChange',
  });

  const { fields: permissionFields, append, remove } = useFieldArray({
    control,
    name: 'permissions',
  });

  const watchedPermissions = watch('permissions');

  // Utility functions for bitmask operations
  const hasMethod = useCallback((mask: number, methodValue: number): boolean => {
    return (mask & methodValue) === methodValue;
  }, []);

  const toggleMethod = useCallback((mask: number, methodValue: number): number => {
    return mask ^ methodValue;
  }, []);

  const hasRequestorType = useCallback((mask: number, typeValue: number): boolean => {
    return (mask & typeValue) === typeValue;
  }, []);

  const toggleRequestorType = useCallback((mask: number, typeValue: number): number => {
    return mask ^ typeValue;
  }, []);

  const getSelectedMethods = useMemo(() => (mask: number): HttpMethod[] => {
    return HTTP_METHODS.filter(method => hasMethod(mask, method.value));
  }, [hasMethod]);

  const getSelectedRequestorTypes = useMemo(() => (mask: number): RequestorType[] => {
    return REQUESTOR_TYPES.filter(type => hasRequestorType(mask, type.value));
  }, [hasRequestorType]);

  // Toggle permission expansion
  const togglePermissionExpansion = useCallback((index: number) => {
    setExpandedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Add new permission rule
  const addPermissionRule = useCallback(() => {
    append({
      serviceId: serviceId || 0,
      roleId: 0,
      component: '',
      verbMask: 0,
      requestorMask: 0,
      filters: [],
      filterOp: 'AND' as const,
      isActive: true,
    });
  }, [append, serviceId]);

  // Handle form submission
  const onSubmit = useCallback(async (data: { permissions: EndpointPermissionFormData[] }) => {
    if (!onSave) return;

    setSaving(true);
    try {
      const permissionsToSave: EndpointPermission[] = data.permissions.map((permission, index) => ({
        id: permissions[index]?.id,
        ...permission,
      }));
      
      await onSave(permissionsToSave);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, permissions]);

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LockClosedIcon className="h-6 w-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Endpoint Permissions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure granular access control for API endpoints with HTTP method-specific permissions
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addPermissionRule}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Permission Rule
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Permission Rules */}
        <div className="space-y-4">
          {permissionFields.map((field, permissionIndex) => {
            const permission = watchedPermissions[permissionIndex];
            const isExpanded = expandedPermissions.has(permissionIndex);
            const selectedMethods = getSelectedMethods(permission?.verbMask || 0);
            const selectedRequestorTypes = getSelectedRequestorTypes(permission?.requestorMask || 0);

            return (
              <div
                key={field.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              >
                {/* Permission Rule Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => togglePermissionExpansion(permissionIndex)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {permission?.component || 'New Permission Rule'}
                        </span>
                        {!permission?.isActive && (
                          <Badge variant="warning" size="sm">Disabled</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedMethods.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Methods:</span>
                            {selectedMethods.map(method => (
                              <Badge key={method.value} variant="info" size="sm">
                                {method.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {selectedRequestorTypes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Access:</span>
                            {selectedRequestorTypes.map(type => (
                              <Badge key={type.value} variant="default" size="sm">
                                {type.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(permissionIndex);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    disabled={permissionFields.length === 1}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Permission Rule Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-6">
                    {/* Basic Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField 
                        label="Component/Endpoint" 
                        required
                        error={errors.permissions?.[permissionIndex]?.component?.message}
                      >
                        <Controller
                          name={`permissions.${permissionIndex}.component`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              placeholder="e.g., users, products, orders"
                            />
                          )}
                        />
                      </FormField>

                      <FormField label="Active">
                        <Controller
                          name={`permissions.${permissionIndex}.isActive`}
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Enable this permission rule
                              </span>
                            </div>
                          )}
                        />
                      </FormField>
                    </div>

                    {/* HTTP Methods */}
                    <FormField 
                      label="Allowed HTTP Methods" 
                      required
                      error={errors.permissions?.[permissionIndex]?.verbMask?.message}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {HTTP_METHODS.map((method) => {
                          const isSelected = hasMethod(permission?.verbMask || 0, method.value);
                          return (
                            <div
                              key={method.value}
                              className={clsx(
                                'relative p-3 border rounded-lg cursor-pointer transition-colors',
                                isSelected
                                  ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                              )}
                              onClick={() => {
                                const newMask = toggleMethod(permission?.verbMask || 0, method.value);
                                setValue(`permissions.${permissionIndex}.verbMask`, newMask);
                              }}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by parent onClick
                                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {method.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {method.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </FormField>

                    {/* Requestor Types */}
                    <FormField 
                      label="Allowed Requestor Types" 
                      required
                      error={errors.permissions?.[permissionIndex]?.requestorMask?.message}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {REQUESTOR_TYPES.map((type) => {
                          const isSelected = hasRequestorType(permission?.requestorMask || 0, type.value);
                          return (
                            <div
                              key={type.value}
                              className={clsx(
                                'relative p-3 border rounded-lg cursor-pointer transition-colors',
                                isSelected
                                  ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                              )}
                              onClick={() => {
                                const newMask = toggleRequestorType(permission?.requestorMask || 0, type.value);
                                setValue(`permissions.${permissionIndex}.requestorMask`, newMask);
                              }}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by parent onClick
                                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {type.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </FormField>

                    {/* Request Filters */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormField label="Request Filters (Optional)">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Add conditions to filter requests based on specific criteria
                          </p>
                        </FormField>
                        <Controller
                          name={`permissions.${permissionIndex}.filterOp`}
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            >
                              <option value="AND">AND (all conditions)</option>
                              <option value="OR">OR (any condition)</option>
                            </select>
                          )}
                        />
                      </div>

                      <FilterArrayField 
                        control={control} 
                        permissionIndex={permissionIndex} 
                        errors={errors}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!isValid || !isDirty || saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Filter Array Field Component
interface FilterArrayFieldProps {
  control: any;
  permissionIndex: number;
  errors: any;
}

const FilterArrayField: React.FC<FilterArrayFieldProps> = ({ 
  control, 
  permissionIndex, 
  errors 
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `permissions.${permissionIndex}.filters`,
  });

  const addFilter = useCallback(() => {
    append({
      field: '',
      operator: 'equals' as const,
      value: '',
      logicalOperator: 'AND' as const,
    });
  }, [append]);

  return (
    <div className="space-y-3">
      {fields.map((field, filterIndex) => (
        <div
          key={field.id}
          className="flex items-end gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField 
              label="Field" 
              error={errors.permissions?.[permissionIndex]?.filters?.[filterIndex]?.field?.message}
            >
              <Controller
                name={`permissions.${permissionIndex}.filters.${filterIndex}.field`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    placeholder="e.g., user_id, status"
                  />
                )}
              />
            </FormField>

            <FormField label="Operator">
              <Controller
                name={`permissions.${permissionIndex}.filters.${filterIndex}.operator`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  >
                    {FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormField>

            <FormField 
              label="Value" 
              error={errors.permissions?.[permissionIndex]?.filters?.[filterIndex]?.value?.message}
            >
              <Controller
                name={`permissions.${permissionIndex}.filters.${filterIndex}.value`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    placeholder="Filter value"
                  />
                )}
              />
            </FormField>
          </div>

          <button
            type="button"
            onClick={() => remove(filterIndex)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addFilter}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <PlusIcon className="h-4 w-4" />
        Add Filter
      </button>
    </div>
  );
};

export default EndpointPermissions;