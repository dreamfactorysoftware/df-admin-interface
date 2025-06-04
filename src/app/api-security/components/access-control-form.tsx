/**
 * Access Control Form Component
 * 
 * Specialized form component for configuring role-based access control rules 
 * and service permissions. Implements complex nested form structures using 
 * React Hook Form arrays, dynamic component selection, advanced filtering 
 * options, and multi-level permission assignments.
 * 
 * Replaces the Angular df-roles-access component functionality with modern
 * React/Next.js architecture using Headless UI and Tailwind CSS.
 * 
 * Features:
 * - React Hook Form useFieldArray for nested form structures
 * - Complex Zod schema validation for nested permission objects
 * - Advanced filtering interface for role-based access control
 * - Dynamic component loading based on service selection
 * - WCAG 2.1 AA compliant interface
 * - Real-time validation under 100ms
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { Fragment, useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Disclosure, 
  Transition, 
  Combobox, 
  Switch,
  Dialog
} from '@headlessui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// UI Components
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormErrorMessage,
  FormSection,
  FormGroup,
  FormActions
} from '@/components/ui/form';
import { Select, SelectOption } from '@/components/ui/select';

// Types
import { 
  RoleServiceAccessType,
  RoleAccessFilter,
  RolePermission,
  AccessLevel,
  RequesterLevel,
  RoleServiceAccessSchema,
  RoleAccessFilterSchema,
  RolePermissionSchema
} from '@/types/role';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Service definition for dynamic component loading
 */
interface ServiceType {
  id: number;
  name: string;
  label: string;
  description: string;
  component: string;
  type: 'database' | 'rest' | 'soap' | 'file' | 'email' | 'script' | 'oauth';
  active: boolean;
  endpoints?: ServiceEndpoint[];
}

/**
 * Service endpoint configuration
 */
interface ServiceEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  requiresAuth: boolean;
  parameters?: EndpointParameter[];
}

/**
 * Endpoint parameter definition
 */
interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

/**
 * Filter operator configuration
 */
interface FilterOperator {
  value: RoleAccessFilter['operator'];
  label: string;
  description: string;
  valueType: 'string' | 'number' | 'boolean' | 'array';
  requiresValue: boolean;
}

/**
 * Access control form data structure
 */
interface AccessControlFormData {
  roleId: number;
  serviceAccesses: RoleServiceAccessType[];
  permissions: RolePermission[];
  globalSettings: {
    inheritFromParent: boolean;
    allowAllServices: boolean;
    denyByDefault: boolean;
    logAccess: boolean;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Advanced filter validation with conditional logic
 */
const advancedFilterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Filter name is required'),
  operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'like', 'not_like']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()]))
  ]),
  conjunction: z.enum(['and', 'or']).optional(),
  groupId: z.string().optional(),
  enabled: z.boolean().default(true),
});

/**
 * Enhanced service access schema with nested filters
 */
const enhancedServiceAccessSchema = z.object({
  id: z.number().optional(),
  roleId: z.number().min(1, 'Role ID is required'),
  serviceId: z.number().min(1, 'Service ID is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  component: z.string().min(1, 'Component is required'),
  access: z.number().min(0).max(15, 'Invalid access level'),
  requester: z.number().min(0).max(3, 'Invalid requester level'),
  filters: z.array(advancedFilterSchema).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  advancedConfig: z.object({
    rateLimiting: z.object({
      enabled: z.boolean().default(false),
      requestsPerMinute: z.number().min(1).max(10000).optional(),
      burstLimit: z.number().min(1).optional(),
    }).optional(),
    ipRestrictions: z.object({
      enabled: z.boolean().default(false),
      allowedIps: z.array(z.string().ip()).optional(),
      deniedIps: z.array(z.string().ip()).optional(),
    }).optional(),
    timeRestrictions: z.object({
      enabled: z.boolean().default(false),
      allowedHours: z.array(z.number().min(0).max(23)).optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).optional(),
});

/**
 * Complete access control form validation schema
 */
const accessControlFormSchema = z.object({
  roleId: z.number().min(1, 'Role ID is required'),
  serviceAccesses: z.array(enhancedServiceAccessSchema),
  permissions: z.array(RolePermissionSchema),
  globalSettings: z.object({
    inheritFromParent: z.boolean().default(false),
    allowAllServices: z.boolean().default(false),
    denyByDefault: z.boolean().default(true),
    logAccess: z.boolean().default(true),
  }),
});

// =============================================================================
// UTILITY FUNCTIONS AND HOOKS
// =============================================================================

/**
 * Mock hook for services data (replacing use-services.ts)
 */
const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<ServiceType[]> => {
      // Mock service data for development
      return [
        {
          id: 1,
          name: 'database-mysql',
          label: 'MySQL Database',
          description: 'Primary MySQL database connection',
          component: 'database',
          type: 'database',
          active: true,
          endpoints: [
            { id: '1', name: 'Table Operations', method: 'GET', path: '/{table}', requiresAuth: true },
            { id: '2', name: 'Record Creation', method: 'POST', path: '/{table}', requiresAuth: true },
            { id: '3', name: 'Record Updates', method: 'PUT', path: '/{table}', requiresAuth: true },
            { id: '4', name: 'Record Deletion', method: 'DELETE', path: '/{table}', requiresAuth: true },
          ]
        },
        {
          id: 2,
          name: 'rest-api',
          label: 'External REST API',
          description: 'Third-party REST API integration',
          component: 'rest',
          type: 'rest',
          active: true,
          endpoints: [
            { id: '5', name: 'Get Data', method: 'GET', path: '/data', requiresAuth: true },
            { id: '6', name: 'Post Data', method: 'POST', path: '/data', requiresAuth: true },
          ]
        },
        {
          id: 3,
          name: 'file-storage',
          label: 'File Storage Service',
          description: 'Local file storage management',
          component: 'file',
          type: 'file',
          active: true,
          endpoints: [
            { id: '7', name: 'File Upload', method: 'POST', path: '/files', requiresAuth: true },
            { id: '8', name: 'File Download', method: 'GET', path: '/files/{id}', requiresAuth: true },
          ]
        },
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Filter operators configuration
 */
const FILTER_OPERATORS: FilterOperator[] = [
  { value: 'eq', label: 'Equals', description: 'Exact match', valueType: 'string', requiresValue: true },
  { value: 'ne', label: 'Not Equals', description: 'Does not match', valueType: 'string', requiresValue: true },
  { value: 'gt', label: 'Greater Than', description: 'Numeric comparison', valueType: 'number', requiresValue: true },
  { value: 'lt', label: 'Less Than', description: 'Numeric comparison', valueType: 'number', requiresValue: true },
  { value: 'gte', label: 'Greater Than or Equal', description: 'Numeric comparison', valueType: 'number', requiresValue: true },
  { value: 'lte', label: 'Less Than or Equal', description: 'Numeric comparison', valueType: 'number', requiresValue: true },
  { value: 'in', label: 'In List', description: 'Matches any value in list', valueType: 'array', requiresValue: true },
  { value: 'not_in', label: 'Not In List', description: 'Does not match any value in list', valueType: 'array', requiresValue: true },
  { value: 'like', label: 'Contains', description: 'Pattern matching', valueType: 'string', requiresValue: true },
  { value: 'not_like', label: 'Does Not Contain', description: 'Negative pattern matching', valueType: 'string', requiresValue: true },
];

/**
 * Access level options for permissions
 */
const ACCESS_LEVEL_OPTIONS: SelectOption[] = [
  { value: AccessLevel.NONE, label: 'No Access', description: 'Complete access denial' },
  { value: AccessLevel.READ, label: 'Read Only', description: 'View data only' },
  { value: AccessLevel.CREATE, label: 'Create', description: 'Add new records' },
  { value: AccessLevel.UPDATE, label: 'Update', description: 'Modify existing records' },
  { value: AccessLevel.DELETE, label: 'Delete', description: 'Remove records' },
  { value: AccessLevel.ADMIN, label: 'Full Access', description: 'Complete administrative control' },
];

/**
 * Requester level options
 */
const REQUESTER_LEVEL_OPTIONS: SelectOption[] = [
  { value: RequesterLevel.NONE, label: 'None', description: 'No proxy requests allowed' },
  { value: RequesterLevel.SELF, label: 'Self Only', description: 'User can only request for themselves' },
  { value: RequesterLevel.OTHERS, label: 'Others Only', description: 'User can only request for others' },
  { value: RequesterLevel.ALL, label: 'All', description: 'User can request for anyone' },
];

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const disclosureStyles = cva(
  'w-full rounded-lg border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        expanded: 'border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20',
        error: 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeStyles = cva(
  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
        error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Badge component for status indicators
 */
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className }) => (
  <span className={cn(badgeStyles({ variant }), className)}>
    {children}
  </span>
);

/**
 * Advanced Filter Builder Component
 */
const FilterBuilder: React.FC<{
  filters: z.infer<typeof advancedFilterSchema>[];
  onChange: (filters: z.infer<typeof advancedFilterSchema>[]) => void;
  onError?: (error: string) => void;
}> = ({ filters, onChange, onError }) => {
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterName, setFilterName] = useState<string>('');

  const addFilter = useCallback(() => {
    if (!filterName.trim() || !selectedOperator) {
      onError?.('Filter name and operator are required');
      return;
    }

    let processedValue: any = filterValue;
    
    // Process value based on operator type
    if (selectedOperator.valueType === 'number') {
      processedValue = parseFloat(filterValue);
      if (isNaN(processedValue)) {
        onError?.('Invalid number value');
        return;
      }
    } else if (selectedOperator.valueType === 'boolean') {
      processedValue = filterValue.toLowerCase() === 'true';
    } else if (selectedOperator.valueType === 'array') {
      processedValue = filterValue.split(',').map(v => v.trim()).filter(Boolean);
    }

    const newFilter: z.infer<typeof advancedFilterSchema> = {
      id: `filter_${Date.now()}`,
      name: filterName.trim(),
      operator: selectedOperator.value,
      value: processedValue,
      conjunction: filters.length > 0 ? 'and' : undefined,
      enabled: true,
    };

    onChange([...filters, newFilter]);
    
    // Reset form
    setFilterName('');
    setFilterValue('');
    setSelectedOperator(null);
  }, [filterName, selectedOperator, filterValue, filters, onChange, onError]);

  const removeFilter = useCallback((index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  }, [filters, onChange]);

  const toggleFilter = useCallback((index: number) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], enabled: !newFilters[index].enabled };
    onChange(newFilters);
  }, [filters, onChange]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Add Filter Condition
        </h4>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="filter-name" className="text-xs">Field Name</FormLabel>
            <input
              id="filter-name"
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g., user_id, status, created_date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          
          <div>
            <FormLabel htmlFor="filter-operator" className="text-xs">Operator</FormLabel>
            <Combobox value={selectedOperator} onChange={setSelectedOperator}>
              <div className="relative mt-1">
                <Combobox.Input
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  displayValue={(operator: FilterOperator) => operator?.label ?? ''}
                  placeholder="Select operator..."
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-1.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                  </svg>
                </Combobox.Button>
                
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                    {FILTER_OPERATORS.map((operator) => (
                      <Combobox.Option
                        key={operator.value}
                        value={operator}
                        className={({ active }) =>
                          cn(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100'
                          )
                        }
                      >
                        <div>
                          <span className="block truncate font-medium">{operator.label}</span>
                          <span className="block text-xs opacity-75">{operator.description}</span>
                        </div>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          </div>
          
          <div>
            <FormLabel htmlFor="filter-value" className="text-xs">Value</FormLabel>
            <input
              id="filter-value"
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={
                selectedOperator?.valueType === 'array' 
                  ? 'comma,separated,values' 
                  : selectedOperator?.valueType === 'boolean'
                  ? 'true or false'
                  : 'Enter value...'
              }
              disabled={!selectedOperator?.requiresValue}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={addFilter}
            disabled={!filterName.trim() || !selectedOperator}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Filter
          </button>
        </div>
      </div>

      {/* Applied Filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Applied Filters ({filters.length})
          </h4>
          
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div
                key={filter.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  filter.enabled 
                    ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    : 'border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={filter.enabled}
                    onChange={() => toggleFilter(index)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      filter.enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        filter.enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </Switch>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {filter.name}
                      </code>
                      <Badge variant="info">
                        {FILTER_OPERATORS.find(op => op.value === filter.operator)?.label}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
                      </span>
                    </div>
                    {index > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {filter.conjunction?.toUpperCase()} condition
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFilter(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Service Access Configuration Component
 */
const ServiceAccessForm: React.FC<{
  index: number;
  serviceAccess: RoleServiceAccessType;
  services: ServiceType[];
  onUpdate: (index: number, serviceAccess: RoleServiceAccessType) => void;
  onRemove: (index: number) => void;
}> = ({ index, serviceAccess, services, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    services.find(s => s.id === serviceAccess.serviceId) || null
  );

  const handleServiceChange = useCallback((service: ServiceType | null) => {
    setSelectedService(service);
    if (service) {
      onUpdate(index, {
        ...serviceAccess,
        serviceId: service.id,
        serviceName: service.name,
        component: service.component,
      });
    }
  }, [index, serviceAccess, onUpdate]);

  const handleAccessChange = useCallback((access: number) => {
    onUpdate(index, { ...serviceAccess, access });
  }, [index, serviceAccess, onUpdate]);

  const handleRequesterChange = useCallback((requester: number) => {
    onUpdate(index, { ...serviceAccess, requester });
  }, [index, serviceAccess, onUpdate]);

  const handleFiltersChange = useCallback((filters: z.infer<typeof advancedFilterSchema>[]) => {
    onUpdate(index, { ...serviceAccess, filters });
  }, [index, serviceAccess, onUpdate]);

  return (
    <Disclosure>
      {({ open }) => (
        <div className={cn(disclosureStyles({ variant: open ? 'expanded' : 'default' }))}>
          <Disclosure.Button
            className="flex w-full items-center justify-between p-4 text-left text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Badge variant={serviceAccess.isActive ? 'success' : 'error'}>
                  {serviceAccess.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedService?.label || 'Select Service'}
                </span>
                {selectedService && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedService.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="info">
                {ACCESS_LEVEL_OPTIONS.find(opt => opt.value === serviceAccess.access)?.label || 'No Access'}
              </Badge>
              <svg
                className={cn('h-5 w-5 text-gray-500 transition-transform', {
                  'rotate-180': open
                })}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Disclosure.Button>
          
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="space-y-6">
                {/* Service Selection */}
                <FormField>
                  <FormLabel required>Service</FormLabel>
                  <Combobox value={selectedService} onChange={handleServiceChange}>
                    <div className="relative mt-1">
                      <Combobox.Input
                        className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        displayValue={(service: ServiceType) => service?.label ?? ''}
                        placeholder="Search services..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-1.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                      </Combobox.Button>
                      
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                          {services.filter(service => service.active).map((service) => (
                            <Combobox.Option
                              key={service.id}
                              value={service}
                              className={({ active }) =>
                                cn(
                                  'relative cursor-default select-none py-2 pl-3 pr-9',
                                  active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100'
                                )
                              }
                            >
                              <div>
                                <span className="block truncate font-medium">{service.label}</span>
                                <span className="block text-xs opacity-75">{service.description}</span>
                              </div>
                            </Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>
                  <FormDescription>
                    Select the service this access rule applies to
                  </FormDescription>
                </FormField>

                {/* Access Level and Requester Settings */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField>
                    <FormLabel required>Access Level</FormLabel>
                    <Select
                      value={serviceAccess.access}
                      onChange={(value) => handleAccessChange(Number(value))}
                      options={ACCESS_LEVEL_OPTIONS}
                      placeholder="Select access level..."
                    />
                    <FormDescription>
                      Define what operations this role can perform
                    </FormDescription>
                  </FormField>

                  <FormField>
                    <FormLabel>Requester Level</FormLabel>
                    <Select
                      value={serviceAccess.requester}
                      onChange={(value) => handleRequesterChange(Number(value))}
                      options={REQUESTER_LEVEL_OPTIONS}
                      placeholder="Select requester level..."
                    />
                    <FormDescription>
                      Control proxy request permissions
                    </FormDescription>
                  </FormField>
                </div>

                {/* Advanced Filters */}
                <FormField>
                  <FormLabel>Access Filters</FormLabel>
                  <FilterBuilder
                    filters={serviceAccess.filters || []}
                    onChange={handleFiltersChange}
                  />
                  <FormDescription>
                    Add conditional filters to restrict access based on data values
                  </FormDescription>
                </FormField>

                {/* Service Endpoints (if available) */}
                {selectedService?.endpoints && selectedService.endpoints.length > 0 && (
                  <FormField>
                    <FormLabel>Available Endpoints</FormLabel>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                      <div className="space-y-2">
                        {selectedService.endpoints.map((endpoint) => (
                          <div key={endpoint.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant={endpoint.method === 'GET' ? 'info' : endpoint.method === 'POST' ? 'success' : 'warning'}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-xs">{endpoint.path}</code>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {endpoint.name}
                              </span>
                            </div>
                            {endpoint.requiresAuth && (
                              <Badge variant="warning">Auth Required</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </FormField>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Access Rule
                </button>
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface AccessControlFormProps {
  /** Role ID for which to configure access */
  roleId: number;
  
  /** Initial form data */
  initialData?: Partial<AccessControlFormData>;
  
  /** Callback fired when form is submitted successfully */
  onSubmit?: (data: AccessControlFormData) => void | Promise<void>;
  
  /** Callback fired when form is cancelled */
  onCancel?: () => void;
  
  /** Loading state */
  loading?: boolean;
  
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
  
  /** Custom CSS class name */
  className?: string;
}

/**
 * Access Control Form Component
 * 
 * Main form component for configuring role-based access control rules
 * and service permissions with advanced filtering capabilities.
 */
const AccessControlForm: React.FC<AccessControlFormProps> = ({
  roleId,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'edit',
  className,
}) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Query for services data
  const { 
    data: services = [], 
    isLoading: servicesLoading,
    error: servicesError 
  } = useServices();

  // Form setup with React Hook Form and Zod validation
  const form = useForm<AccessControlFormData>({
    resolver: zodResolver(accessControlFormSchema),
    defaultValues: {
      roleId,
      serviceAccesses: initialData?.serviceAccesses || [],
      permissions: initialData?.permissions || [],
      globalSettings: {
        inheritFromParent: false,
        allowAllServices: false,
        denyByDefault: true,
        logAccess: true,
        ...initialData?.globalSettings,
      },
    },
    mode: 'onChange',
  });

  const { 
    control, 
    handleSubmit, 
    watch, 
    formState: { errors, isSubmitting, isDirty: formIsDirty },
    reset
  } = form;

  // Field arrays for dynamic form sections
  const { 
    fields: serviceAccessFields, 
    append: appendServiceAccess, 
    remove: removeServiceAccess,
    update: updateServiceAccess
  } = useFieldArray({
    control,
    name: 'serviceAccesses',
  });

  const { 
    fields: permissionFields, 
    append: appendPermission, 
    remove: removePermission 
  } = useFieldArray({
    control,
    name: 'permissions',
  });

  // Watch for form changes
  const watchedData = watch();
  
  React.useEffect(() => {
    setIsDirty(formIsDirty);
  }, [formIsDirty]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: AccessControlFormData) => {
      if (onSubmit) {
        await onSubmit(data);
      }
      return data;
    },
    onSuccess: () => {
      setSubmitError(null);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'access'] });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  // Form submission handler
  const handleFormSubmit = useCallback(async (data: AccessControlFormData) => {
    setSubmitError(null);
    
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [submitMutation]);

  // Add new service access rule
  const addServiceAccess = useCallback(() => {
    const newServiceAccess: RoleServiceAccessType = {
      roleId,
      serviceId: 0,
      serviceName: '',
      component: '',
      access: AccessLevel.READ,
      requester: RequesterLevel.SELF,
      filters: [],
      isActive: true,
    };
    
    appendServiceAccess(newServiceAccess);
  }, [roleId, appendServiceAccess]);

  // Update service access rule
  const handleServiceAccessUpdate = useCallback((index: number, serviceAccess: RoleServiceAccessType) => {
    updateServiceAccess(index, serviceAccess);
  }, [updateServiceAccess]);

  // Error handling for services loading
  if (servicesError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Services
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Unable to load service configuration. Please refresh the page and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-4xl', className)}>
      <Form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Access Control Configuration
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configure role-based access control rules and service permissions for this role.
            Use advanced filters to create granular access conditions.
          </p>
        </div>

        {/* Submit Error Display */}
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Submission Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {submitError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Settings */}
        <FormSection
          title="Global Settings"
          description="Configure global access control behavior for this role"
        >
          <Controller
            name="globalSettings"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.value.inheritFromParent}
                      onChange={(checked) => field.onChange({ ...field.value, inheritFromParent: checked })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        field.value.inheritFromParent ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          field.value.inheritFromParent ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </Switch>
                    <FormLabel>Inherit from Parent Role</FormLabel>
                  </div>
                  <FormDescription>
                    Inherit permissions from parent roles in the hierarchy
                  </FormDescription>
                </FormField>

                <FormField>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.value.allowAllServices}
                      onChange={(checked) => field.onChange({ ...field.value, allowAllServices: checked })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        field.value.allowAllServices ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          field.value.allowAllServices ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </Switch>
                    <FormLabel>Allow All Services</FormLabel>
                  </div>
                  <FormDescription>
                    Grant access to all services by default
                  </FormDescription>
                </FormField>

                <FormField>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.value.denyByDefault}
                      onChange={(checked) => field.onChange({ ...field.value, denyByDefault: checked })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        field.value.denyByDefault ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          field.value.denyByDefault ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </Switch>
                    <FormLabel>Deny by Default</FormLabel>
                  </div>
                  <FormDescription>
                    Deny access unless explicitly granted
                  </FormDescription>
                </FormField>

                <FormField>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.value.logAccess}
                      onChange={(checked) => field.onChange({ ...field.value, logAccess: checked })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        field.value.logAccess ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          field.value.logAccess ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </Switch>
                    <FormLabel>Log Access Attempts</FormLabel>
                  </div>
                  <FormDescription>
                    Enable detailed logging of access attempts
                  </FormDescription>
                </FormField>
              </div>
            )}
          />
        </FormSection>

        {/* Service Access Rules */}
        <FormSection
          title="Service Access Rules"
          description="Configure access permissions for specific services and endpoints"
        >
          <div className="space-y-4">
            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading services...</span>
                </div>
              </div>
            ) : serviceAccessFields.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No access rules configured</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add service access rules to control what services this role can access.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={addServiceAccess}
                    className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Service Access Rule
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {serviceAccessFields.map((field, index) => (
                    <ServiceAccessForm
                      key={field.id}
                      index={index}
                      serviceAccess={watchedData.serviceAccesses[index]}
                      services={services}
                      onUpdate={handleServiceAccessUpdate}
                      onRemove={removeServiceAccess}
                    />
                  ))}
                </div>
                
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={addServiceAccess}
                    className="inline-flex items-center rounded-md border border-primary-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-primary-600 dark:bg-gray-800 dark:text-primary-300 dark:hover:bg-gray-700"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another Service Access Rule
                  </button>
                </div>
              </>
            )}
            
            <FormErrorMessage error={errors.serviceAccesses?.message} />
          </div>
        </FormSection>

        {/* Form Actions */}
        <FormActions justify="between">
          <div>
            {isDirty && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                You have unsaved changes
              </p>
            )}
          </div>
          
          <div className="space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || loading || (!isDirty && mode === 'edit')}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {mode === 'create' ? 'Create Access Rules' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </FormActions>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Debug Information
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-gray-600 dark:text-gray-400">
              {JSON.stringify({ 
                formData: watchedData, 
                errors, 
                isDirty,
                servicesCount: services.length 
              }, null, 2)}
            </pre>
          </details>
        )}
      </Form>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default AccessControlForm;
export type { AccessControlFormProps, AccessControlFormData };