'use client';

/**
 * AccessControlForm Component
 * 
 * Specialized form component for configuring role-based access control rules and service permissions.
 * Implements complex nested form structures using React Hook Form arrays, dynamic component selection,
 * advanced filtering options, and multi-level permission assignments.
 * 
 * Replaces the Angular df-roles-access component functionality with modern React patterns.
 * 
 * @fileoverview Access control configuration form for role-based permissions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Disclosure, 
  Combobox, 
  Switch,
  Tab,
  Dialog,
  Transition
} from '@headlessui/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  FilterIcon,
  CheckIcon,
  SelectorIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * HTTP verbs for API access control with bitmask values
 */
export enum HttpVerb {
  GET = 1,
  POST = 2,
  PUT = 4,
  PATCH = 8,
  DELETE = 16,
  OPTIONS = 32,
  HEAD = 64,
}

/**
 * Filter operators for access control rules
 */
export enum FilterOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

/**
 * Filter condition types for advanced filtering
 */
export enum ConditionType {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

/**
 * Service definition for dynamic loading
 */
export interface ServiceDefinition {
  id: number;
  name: string;
  label: string;
  type: string;
  description?: string;
  isActive: boolean;
  components?: ServiceComponent[];
  supportedVerbs: HttpVerb[];
}

/**
 * Service component definition
 */
export interface ServiceComponent {
  name: string;
  label: string;
  description?: string;
  supportedVerbs: HttpVerb[];
  fields?: ComponentField[];
}

/**
 * Component field definition for filtering
 */
export interface ComponentField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  label: string;
  enumValues?: string[];
  nullable?: boolean;
}

/**
 * Filter condition for access control rules
 */
export interface FilterCondition {
  id: string;
  field: string;
  operator: ConditionType;
  value: string | number | boolean | null;
  fieldType: ComponentField['type'];
}

/**
 * Service access permission configuration
 */
export interface ServiceAccessPermission {
  id: string;
  serviceId: number;
  serviceName: string;
  component?: string;
  componentLabel?: string;
  allowedVerbs: HttpVerb[];
  requestorType: number;
  filters: FilterCondition[];
  filterOperator: FilterOperator;
  isEnabled: boolean;
}

/**
 * Access control form data structure
 */
export interface AccessControlFormData {
  roleId: number;
  roleName: string;
  description: string;
  isActive: boolean;
  servicePermissions: ServiceAccessPermission[];
  defaultDenyAll: boolean;
  inheritFromParent: boolean;
  parentRoleId?: number;
}

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for filter condition validation
 */
const FilterConditionSchema = z.object({
  id: z.string().min(1, 'Filter ID is required'),
  field: z.string().min(1, 'Field is required'),
  operator: z.nativeEnum(ConditionType, {
    errorMap: () => ({ message: 'Invalid condition operator' }),
  }),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ]),
  fieldType: z.enum(['string', 'number', 'boolean', 'date', 'enum'], {
    errorMap: () => ({ message: 'Invalid field type' }),
  }),
});

/**
 * Zod schema for service access permission validation
 */
const ServiceAccessPermissionSchema = z.object({
  id: z.string().min(1, 'Permission ID is required'),
  serviceId: z.number().int().positive('Service ID must be a positive integer'),
  serviceName: z.string().min(1, 'Service name is required'),
  component: z.string().optional(),
  componentLabel: z.string().optional(),
  allowedVerbs: z.array(z.nativeEnum(HttpVerb)).min(1, 'At least one HTTP verb must be selected'),
  requestorType: z.number().int().min(0, 'Requestor type must be non-negative'),
  filters: z.array(FilterConditionSchema).default([]),
  filterOperator: z.nativeEnum(FilterOperator).default(FilterOperator.AND),
  isEnabled: z.boolean().default(true),
});

/**
 * Main form validation schema
 */
export const AccessControlFormSchema = z.object({
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  roleName: z.string()
    .min(1, 'Role name is required')
    .max(64, 'Role name must be less than 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  servicePermissions: z.array(ServiceAccessPermissionSchema).default([]),
  defaultDenyAll: z.boolean().default(false),
  inheritFromParent: z.boolean().default(false),
  parentRoleId: z.number().int().positive().optional(),
});

// ============================================================================
// Component Variants
// ============================================================================

const formSectionVariants = cva(
  "rounded-lg border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-300 bg-white",
        highlighted: "border-primary-500 bg-primary-50 shadow-sm",
        error: "border-error-500 bg-error-50",
        disabled: "border-gray-200 bg-gray-50 opacity-60",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const permissionCardVariants = cva(
  "rounded border transition-all duration-200 hover:shadow-md",
  {
    variants: {
      state: {
        active: "border-green-300 bg-green-50",
        inactive: "border-gray-300 bg-gray-50",
        error: "border-red-300 bg-red-50",
        loading: "border-blue-300 bg-blue-50 animate-pulse",
      },
    },
    defaultVariants: {
      state: "active",
    },
  }
);

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for fetching available services with React Query
 */
function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<ServiceDefinition[]> => {
      const response = await fetch('/api/v2/system/service');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      return data.resource || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching service components dynamically
 */
function useServiceComponents(serviceId: number | null) {
  return useQuery({
    queryKey: ['service-components', serviceId],
    queryFn: async (): Promise<ServiceComponent[]> => {
      if (!serviceId) return [];
      const response = await fetch(`/api/v2/system/service/${serviceId}/components`);
      if (!response.ok) {
        throw new Error('Failed to fetch service components');
      }
      const data = await response.json();
      return data.resource || [];
    },
    enabled: !!serviceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for saving access control configuration
 */
function useUpdateAccessControl() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AccessControlFormData) => {
      const response = await fetch(`/api/v2/system/role/${data.roleId}/access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update access control configuration');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['role', variables.roleId]);
      queryClient.invalidateQueries(['role-permissions', variables.roleId]);
    },
  });
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * HTTP Verb Selection Component
 */
interface VerbSelectorProps {
  selectedVerbs: HttpVerb[];
  availableVerbs: HttpVerb[];
  onChange: (verbs: HttpVerb[]) => void;
  disabled?: boolean;
}

const VerbSelector: React.FC<VerbSelectorProps> = ({
  selectedVerbs,
  availableVerbs,
  onChange,
  disabled = false,
}) => {
  const verbLabels: Record<HttpVerb, string> = {
    [HttpVerb.GET]: 'GET',
    [HttpVerb.POST]: 'POST',
    [HttpVerb.PUT]: 'PUT',
    [HttpVerb.PATCH]: 'PATCH',
    [HttpVerb.DELETE]: 'DELETE',
    [HttpVerb.OPTIONS]: 'OPTIONS',
    [HttpVerb.HEAD]: 'HEAD',
  };

  const handleVerbToggle = (verb: HttpVerb) => {
    if (disabled) return;
    
    const isSelected = selectedVerbs.includes(verb);
    if (isSelected) {
      onChange(selectedVerbs.filter(v => v !== verb));
    } else {
      onChange([...selectedVerbs, verb]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Allowed HTTP Verbs
      </label>
      <div className="flex flex-wrap gap-2">
        {availableVerbs.map((verb) => {
          const isSelected = selectedVerbs.includes(verb);
          return (
            <button
              key={verb}
              type="button"
              onClick={() => handleVerbToggle(verb)}
              disabled={disabled}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md border transition-colors",
                isSelected
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {verbLabels[verb]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Filter Condition Builder Component
 */
interface FilterBuilderProps {
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  availableFields: ComponentField[];
  operator: FilterOperator;
  onOperatorChange: (operator: FilterOperator) => void;
  disabled?: boolean;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  conditions,
  onChange,
  availableFields,
  operator,
  onOperatorChange,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: availableFields[0]?.name || '',
      operator: ConditionType.EQUALS,
      value: '',
      fieldType: availableFields[0]?.type || 'string',
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const getOperatorOptions = (fieldType: ComponentField['type']) => {
    const baseOptions = [
      { value: ConditionType.EQUALS, label: 'Equals' },
      { value: ConditionType.NOT_EQUALS, label: 'Not Equals' },
      { value: ConditionType.IS_NULL, label: 'Is Null' },
      { value: ConditionType.IS_NOT_NULL, label: 'Is Not Null' },
    ];

    if (fieldType === 'string') {
      return [
        ...baseOptions,
        { value: ConditionType.CONTAINS, label: 'Contains' },
        { value: ConditionType.STARTS_WITH, label: 'Starts With' },
        { value: ConditionType.ENDS_WITH, label: 'Ends With' },
        { value: ConditionType.IN, label: 'In List' },
        { value: ConditionType.NOT_IN, label: 'Not In List' },
      ];
    }

    if (fieldType === 'number' || fieldType === 'date') {
      return [
        ...baseOptions,
        { value: ConditionType.GREATER_THAN, label: 'Greater Than' },
        { value: ConditionType.LESS_THAN, label: 'Less Than' },
        { value: ConditionType.IN, label: 'In List' },
        { value: ConditionType.NOT_IN, label: 'Not In List' },
      ];
    }

    return baseOptions;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Access Filters</h4>
        <div className="flex items-center space-x-2">
          <label htmlFor="filter-operator" className="text-xs text-gray-500">
            Logic:
          </label>
          <select
            id="filter-operator"
            value={operator}
            onChange={(e) => onOperatorChange(e.target.value as FilterOperator)}
            disabled={disabled}
            className="text-xs border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={FilterOperator.AND}>AND</option>
            <option value={FilterOperator.OR}>OR</option>
          </select>
          <button
            type="button"
            onClick={addCondition}
            disabled={disabled || availableFields.length === 0}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 border border-primary-300 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <PlusIcon className="w-3 h-3 mr-1" />
            Add Filter
          </button>
        </div>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No filters configured. Access will be granted to all resources.
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((condition, index) => {
            const field = availableFields.find(f => f.name === condition.field);
            const operatorOptions = getOperatorOptions(condition.fieldType);

            return (
              <div key={condition.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                {index > 0 && (
                  <span className="text-xs font-medium text-gray-500 px-2">
                    {operator}
                  </span>
                )}
                
                <select
                  value={condition.field}
                  onChange={(e) => {
                    const selectedField = availableFields.find(f => f.name === e.target.value);
                    updateCondition(condition.id, {
                      field: e.target.value,
                      fieldType: selectedField?.type || 'string',
                      value: '',
                    });
                  }}
                  disabled={disabled}
                  className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-0 flex-1"
                >
                  {availableFields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as ConditionType })}
                  disabled={disabled}
                  className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {operatorOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {!['is_null', 'is_not_null'].includes(condition.operator) && (
                  <input
                    type={condition.fieldType === 'number' ? 'number' : condition.fieldType === 'boolean' ? 'checkbox' : 'text'}
                    value={condition.fieldType === 'boolean' ? undefined : String(condition.value || '')}
                    checked={condition.fieldType === 'boolean' ? Boolean(condition.value) : undefined}
                    onChange={(e) => {
                      let value: string | number | boolean;
                      if (condition.fieldType === 'number') {
                        value = parseFloat(e.target.value) || 0;
                      } else if (condition.fieldType === 'boolean') {
                        value = e.target.checked;
                      } else {
                        value = e.target.value;
                      }
                      updateCondition(condition.id, { value });
                    }}
                    disabled={disabled}
                    placeholder={condition.fieldType === 'string' ? 'Enter value...' : undefined}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-0 flex-1"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeCondition(condition.id)}
                  disabled={disabled}
                  className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Service Permission Configuration Component
 */
interface ServicePermissionConfigProps {
  permission: ServiceAccessPermission;
  onUpdate: (updates: Partial<ServiceAccessPermission>) => void;
  onRemove: () => void;
  services: ServiceDefinition[];
  disabled?: boolean;
}

const ServicePermissionConfig: React.FC<ServicePermissionConfigProps> = ({
  permission,
  onUpdate,
  onRemove,
  services,
  disabled = false,
}) => {
  const selectedService = services.find(s => s.id === permission.serviceId);
  const { data: components = [] } = useServiceComponents(permission.serviceId || null);
  
  const selectedComponent = permission.component 
    ? components.find(c => c.name === permission.component)
    : null;

  const availableVerbs = selectedComponent?.supportedVerbs || selectedService?.supportedVerbs || [];
  const availableFields = selectedComponent?.fields || [];

  return (
    <Disclosure>
      {({ open }) => (
        <div className={permissionCardVariants({ 
          state: permission.isEnabled ? 'active' : 'inactive' 
        })}>
          <Disclosure.Button className="flex w-full items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {open ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
                <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {permission.serviceName}
                  {permission.componentLabel && (
                    <span className="text-gray-500"> / {permission.componentLabel}</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {permission.allowedVerbs.length} verbs, {permission.filters.length} filters
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={permission.isEnabled}
                onChange={(enabled) => onUpdate({ isEnabled: enabled })}
                disabled={disabled}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  permission.isEnabled ? "bg-primary-600" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    permission.isEnabled ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </Switch>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled}
                className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </Disclosure.Button>

          <Disclosure.Panel className="px-4 pb-4 space-y-4">
            {/* Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={permission.serviceId || ''}
                  onChange={(e) => {
                    const serviceId = parseInt(e.target.value);
                    const service = services.find(s => s.id === serviceId);
                    onUpdate({
                      serviceId,
                      serviceName: service?.name || '',
                      component: undefined,
                      componentLabel: undefined,
                      allowedVerbs: [],
                      filters: [],
                    });
                  }}
                  disabled={disabled}
                  className="w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.label} ({service.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Component Selection */}
              {selectedService && components.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component (Optional)
                  </label>
                  <select
                    value={permission.component || ''}
                    onChange={(e) => {
                      const component = components.find(c => c.name === e.target.value);
                      onUpdate({
                        component: e.target.value || undefined,
                        componentLabel: component?.label || undefined,
                        allowedVerbs: [],
                        filters: [],
                      });
                    }}
                    disabled={disabled}
                    className="w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All components</option>
                    {components.map((component) => (
                      <option key={component.name} value={component.name}>
                        {component.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* HTTP Verbs Selection */}
            {selectedService && (
              <VerbSelector
                selectedVerbs={permission.allowedVerbs}
                availableVerbs={availableVerbs}
                onChange={(verbs) => onUpdate({ allowedVerbs: verbs })}
                disabled={disabled}
              />
            )}

            {/* Advanced Filters */}
            {selectedService && availableFields.length > 0 && (
              <FilterBuilder
                conditions={permission.filters}
                onChange={(filters) => onUpdate({ filters })}
                availableFields={availableFields}
                operator={permission.filterOperator}
                onOperatorChange={(operator) => onUpdate({ filterOperator: operator })}
                disabled={disabled}
              />
            )}

            {/* Requestor Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requestor Type
              </label>
              <select
                value={permission.requestorType}
                onChange={(e) => onUpdate({ requestorType: parseInt(e.target.value) })}
                disabled={disabled}
                className="w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={0}>Any</option>
                <option value={1}>API Key</option>
                <option value={2}>Session Token</option>
                <option value={3}>Admin</option>
              </select>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface AccessControlFormProps {
  /** Initial form data */
  initialData?: Partial<AccessControlFormData>;
  /** Form submission handler */
  onSubmit: (data: AccessControlFormData) => void | Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Form variant */
  variant?: 'default' | 'modal' | 'inline';
  /** Additional CSS classes */
  className?: string;
}

/**
 * AccessControlForm Component
 * 
 * Main component for configuring role-based access control rules and service permissions.
 * Features nested form structures, dynamic service loading, advanced filtering, and 
 * comprehensive validation using React Hook Form and Zod.
 */
export const AccessControlForm: React.FC<AccessControlFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  readOnly = false,
  variant = 'default',
  className,
}) => {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const updateAccessControl = useUpdateAccessControl();

  // Form setup with React Hook Form and Zod validation
  const form = useForm<AccessControlFormData>({
    resolver: zodResolver(AccessControlFormSchema),
    defaultValues: {
      roleId: 0,
      roleName: '',
      description: '',
      isActive: true,
      servicePermissions: [],
      defaultDenyAll: false,
      inheritFromParent: false,
      ...initialData,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = form;

  // Field array for service permissions
  const {
    fields: permissionFields,
    append: appendPermission,
    remove: removePermission,
    update: updatePermission,
  } = useFieldArray({
    control,
    name: 'servicePermissions',
  });

  const watchedPermissions = watch('servicePermissions');

  // Add new service permission
  const addServicePermission = useCallback(() => {
    const newPermission: ServiceAccessPermission = {
      id: `permission-${Date.now()}`,
      serviceId: 0,
      serviceName: '',
      allowedVerbs: [],
      requestorType: 0,
      filters: [],
      filterOperator: FilterOperator.AND,
      isEnabled: true,
    };
    appendPermission(newPermission);
  }, [appendPermission]);

  // Update specific permission
  const updateServicePermission = useCallback((index: number, updates: Partial<ServiceAccessPermission>) => {
    const currentPermission = watchedPermissions[index];
    updatePermission(index, { ...currentPermission, ...updates });
  }, [updatePermission, watchedPermissions]);

  // Form submission handler
  const handleFormSubmit = async (data: AccessControlFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit access control form:', error);
    }
  };

  // Generate unique ID for new filters
  const generateFilterId = () => `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className={formSectionVariants({ variant: errors.roleName ? 'error' : 'default' })}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Access Control Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <Controller
                  name="roleName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="roleName"
                      type="text"
                      disabled={readOnly || isLoading}
                      placeholder="Enter role name..."
                      className={cn(
                        "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
                        errors.roleName
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                      )}
                    />
                  )}
                />
                {errors.roleName && (
                  <p className="mt-1 text-xs text-red-600">{errors.roleName.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="flex items-center">
                      <Switch
                        checked={value}
                        onChange={onChange}
                        disabled={readOnly || isLoading}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                          value ? "bg-primary-600" : "bg-gray-200"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            value ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </Switch>
                      <span className="ml-3 text-sm text-gray-700">Active Role</span>
                    </div>
                  )}
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="description"
                    rows={3}
                    disabled={readOnly || isLoading}
                    placeholder="Enter role description..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className={formSectionVariants()}>
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
              <CogIcon className="h-5 w-5 text-gray-600" />
              <span>Global Settings</span>
            </h3>

            <div className="space-y-3">
              <Controller
                name="defaultDenyAll"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <div className="flex items-center">
                    <Switch
                      checked={value}
                      onChange={onChange}
                      disabled={readOnly || isLoading}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        value ? "bg-red-600" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          value ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </Switch>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Default Deny All</span>
                      <p className="text-xs text-gray-500">
                        When enabled, denies access to all resources not explicitly allowed
                      </p>
                    </div>
                  </div>
                )}
              />

              <Controller
                name="inheritFromParent"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <div className="flex items-center">
                    <Switch
                      checked={value}
                      onChange={onChange}
                      disabled={readOnly || isLoading}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        value ? "bg-primary-600" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          value ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </Switch>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Inherit from Parent Role</span>
                      <p className="text-xs text-gray-500">
                        Inherits permissions from a parent role in addition to explicit permissions
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Service Permissions */}
        <div className={formSectionVariants()}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                <span>Service Permissions</span>
                <span className="text-sm text-gray-500">({permissionFields.length})</span>
              </h3>
              <button
                type="button"
                onClick={addServicePermission}
                disabled={readOnly || isLoading || servicesLoading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 border border-primary-300 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Service Permission
              </button>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-sm text-gray-600">Loading services...</span>
              </div>
            ) : permissionFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShieldCheckIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm">No service permissions configured.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add permissions to control access to specific services and their components.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {permissionFields.map((field, index) => (
                  <ServicePermissionConfig
                    key={field.id}
                    permission={watchedPermissions[index]}
                    onUpdate={(updates) => updateServicePermission(index, updates)}
                    onRemove={() => removePermission(index)}
                    services={services}
                    disabled={readOnly || isLoading}
                  />
                ))}
              </div>
            )}

            {errors.servicePermissions && (
              <p className="text-sm text-red-600">
                {errors.servicePermissions.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={readOnly || isLoading || isSubmitting || !isValid}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50",
              "bg-primary-600 hover:bg-primary-700"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Access Control'
            )}
          </button>
        </div>

        {/* Form Status */}
        {isDirty && !isSubmitting && (
          <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>You have unsaved changes</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default AccessControlForm;