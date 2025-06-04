'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Fragment,
  Dialog,
  Transition,
  Tab,
  Switch,
  Disclosure,
  Listbox,
  Combobox,
} from '@headlessui/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  KeyIcon,
  UserGroupIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useApiKeys } from './hooks/useApiKeys';
import { useSecurityConfig } from './hooks/useSecurityConfig';
import { SecurityConfiguration, Role, ApiKeyInfo, EndpointPermission, VerbMask, FilterOperator } from '@/types/security';
import { cn } from '@/lib/utils';

// Zod validation schema for comprehensive security configuration
const securityConfigSchema = z.object({
  serviceId: z.number().positive('Service ID is required'),
  
  // Role-based access control configuration
  roleBasedAccess: z.object({
    enabled: z.boolean().default(true),
    defaultRole: z.number().optional(),
    roles: z.array(z.object({
      roleId: z.number().positive('Role ID is required'),
      permissions: z.object({
        verbMask: z.number().min(0).max(31, 'Invalid verb mask'),
        requestorMask: z.number().min(0, 'Invalid requestor mask'),
        filterOp: z.enum(['AND', 'OR']).default('AND'),
        filters: z.array(z.object({
          field: z.string().min(1, 'Filter field is required'),
          operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN']),
          value: z.string().min(1, 'Filter value is required'),
        })).default([]),
      }),
      endpoints: z.array(z.object({
        resource: z.string().min(1, 'Resource is required'),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        enabled: z.boolean().default(true),
        requireApiKey: z.boolean().default(false),
      })).default([]),
    })).default([]),
  }),

  // API key management configuration  
  apiKeyManagement: z.object({
    enabled: z.boolean().default(true),
    requireApiKey: z.boolean().default(false),
    allowMultipleKeys: z.boolean().default(true),
    keyValidation: z.object({
      requireHeaders: z.array(z.string()).default(['X-DreamFactory-Api-Key']),
      allowQueryParameter: z.boolean().default(true),
      parameterName: z.string().default('api_key'),
    }),
    keys: z.array(z.object({
      name: z.string().min(1, 'API key name is required'),
      apiKey: z.string().min(10, 'API key must be at least 10 characters'),
      roleId: z.number().positive('Role is required'),
      isActive: z.boolean().default(true),
      description: z.string().optional(),
    })).default([]),
  }),

  // Endpoint-level security rules
  endpointSecurity: z.object({
    enabled: z.boolean().default(true),
    defaultPolicy: z.enum(['ALLOW', 'DENY']).default('DENY'),
    rules: z.array(z.object({
      resource: z.string().min(1, 'Resource path is required'),
      methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).min(1, 'At least one method required'),
      requireAuth: z.boolean().default(true),
      requireApiKey: z.boolean().default(false),
      allowedRoles: z.array(z.number()).default([]),
      rateLimiting: z.object({
        enabled: z.boolean().default(false),
        requestsPerMinute: z.number().min(1).max(10000).default(100),
        requestsPerHour: z.number().min(1).max(100000).default(1000),
      }),
    })).default([]),
  }),

  // Advanced security settings
  advancedSettings: z.object({
    enableCORS: z.boolean().default(true),
    corsOrigins: z.array(z.string().url().or(z.literal('*'))).default(['*']),
    enableCSRF: z.boolean().default(true),
    sessionTimeout: z.number().min(5).max(1440).default(30), // minutes
    maxFailedAttempts: z.number().min(1).max(10).default(5),
    lockoutDuration: z.number().min(1).max(60).default(15), // minutes
    enableAuditLogging: z.boolean().default(true),
    logLevel: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']).default('INFO'),
  }),
});

type SecurityConfigFormData = z.infer<typeof securityConfigSchema>;

interface SecurityConfigFormProps {
  serviceId: number;
  serviceName: string;
  onSave: (config: SecurityConfiguration) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  initialConfig?: Partial<SecurityConfiguration>;
}

// Verb mask utilities for REST operations
const VERB_MASKS = {
  GET: 1,      // 0001
  POST: 2,     // 0010  
  PUT: 4,      // 0100
  PATCH: 8,    // 1000
  DELETE: 16,  // 10000
} as const;

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export default function SecurityConfigForm({
  serviceId,
  serviceName,
  onSave,
  onCancel,
  isOpen,
  initialConfig,
}: SecurityConfigFormProps) {
  // React Hook Form with Zod validation - under 100ms validation
  const form = useForm<SecurityConfigFormData>({
    resolver: zodResolver(securityConfigSchema),
    defaultValues: {
      serviceId,
      roleBasedAccess: {
        enabled: true,
        roles: [],
      },
      apiKeyManagement: {
        enabled: true,
        requireApiKey: false,
        allowMultipleKeys: true,
        keyValidation: {
          requireHeaders: ['X-DreamFactory-Api-Key'],
          allowQueryParameter: true,
          parameterName: 'api_key',
        },
        keys: [],
      },
      endpointSecurity: {
        enabled: true,
        defaultPolicy: 'DENY',
        rules: [],
      },
      advancedSettings: {
        enableCORS: true,
        corsOrigins: ['*'],
        enableCSRF: true,
        sessionTimeout: 30,
        maxFailedAttempts: 5,
        lockoutDuration: 15,
        enableAuditLogging: true,
        logLevel: 'INFO',
      },
    },
    mode: 'onChange', // Real-time validation
  });

  // Custom hooks for data fetching with React Query
  const { data: availableRoles, isLoading: rolesLoading } = useSecurityConfig(serviceId);
  const { 
    data: apiKeys, 
    generateApiKey, 
    revokeApiKey, 
    isGenerating,
    isRevoking 
  } = useApiKeys(serviceId);

  // State management
  const [selectedTab, setSelectedTab] = useState(0);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form values for dependent field updates
  const watchedValues = useWatch({ control: form.control });
  const roleBasedEnabled = useWatch({ control: form.control, name: 'roleBasedAccess.enabled' });
  const apiKeyEnabled = useWatch({ control: form.control, name: 'apiKeyManagement.enabled' });

  // Initialize form with existing configuration
  useEffect(() => {
    if (initialConfig) {
      form.reset({
        serviceId,
        ...initialConfig,
      });
    }
  }, [initialConfig, serviceId, form]);

  // Memoized computed values for performance
  const verbMaskOptions = useMemo(() => {
    return HTTP_METHODS.map(method => ({
      method,
      mask: VERB_MASKS[method],
      label: method,
    }));
  }, []);

  const selectedRoles = useMemo(() => {
    return form.watch('roleBasedAccess.roles') || [];
  }, [form, watchedValues]);

  // Helper functions for verb mask manipulation
  const calculateVerbMask = (methods: string[]): number => {
    return methods.reduce((mask, method) => {
      const verbMask = VERB_MASKS[method as keyof typeof VERB_MASKS];
      return mask | (verbMask || 0);
    }, 0);
  };

  const getMethodsFromVerbMask = (verbMask: number): string[] => {
    return HTTP_METHODS.filter(method => {
      const mask = VERB_MASKS[method];
      return (verbMask & mask) === mask;
    });
  };

  // Form submission with comprehensive validation
  const handleSubmit = async (data: SecurityConfigFormData) => {
    try {
      setIsSubmitting(true);

      // Transform form data to SecurityConfiguration
      const config: SecurityConfiguration = {
        serviceId: data.serviceId,
        roleBasedAccess: data.roleBasedAccess,
        apiKeyManagement: data.apiKeyManagement,
        endpointSecurity: data.endpointSecurity,
        advancedSettings: data.advancedSettings,
        lastModified: new Date().toISOString(),
      };

      await onSave(config);
    } catch (error) {
      console.error('Failed to save security configuration:', error);
      form.setError('root', {
        type: 'manual',
        message: 'Failed to save configuration. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // API Key management functions
  const handleGenerateApiKey = async (roleId: number, name: string, description?: string) => {
    try {
      const newKey = await generateApiKey(serviceId, {
        roleId,
        name,
        description,
      });

      const currentKeys = form.getValues('apiKeyManagement.keys');
      form.setValue('apiKeyManagement.keys', [
        ...currentKeys,
        {
          name: newKey.name,
          apiKey: newKey.apiKey,
          roleId: newKey.roleId,
          isActive: true,
          description: newKey.description,
        },
      ]);
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      await revokeApiKey(keyId);
      
      const currentKeys = form.getValues('apiKeyManagement.keys');
      const updatedKeys = currentKeys.filter(key => key.apiKey !== keyId);
      form.setValue('apiKeyManagement.keys', updatedKeys);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  // Role management functions
  const addRoleAccess = (roleId: number) => {
    const currentRoles = form.getValues('roleBasedAccess.roles');
    if (currentRoles.find(r => r.roleId === roleId)) return;

    const newRole = {
      roleId,
      permissions: {
        verbMask: 0,
        requestorMask: 0,
        filterOp: 'AND' as const,
        filters: [],
      },
      endpoints: [],
    };

    form.setValue('roleBasedAccess.roles', [...currentRoles, newRole]);
  };

  const removeRoleAccess = (roleId: number) => {
    const currentRoles = form.getValues('roleBasedAccess.roles');
    const updatedRoles = currentRoles.filter(r => r.roleId !== roleId);
    form.setValue('roleBasedAccess.roles', updatedRoles);
  };

  // Endpoint security rule management
  const addEndpointRule = () => {
    const currentRules = form.getValues('endpointSecurity.rules');
    const newRule = {
      resource: '/*',
      methods: ['GET'] as Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
      requireAuth: true,
      requireApiKey: false,
      allowedRoles: [],
      rateLimiting: {
        enabled: false,
        requestsPerMinute: 100,
        requestsPerHour: 1000,
      },
    };

    form.setValue('endpointSecurity.rules', [...currentRules, newRule]);
  };

  const removeEndpointRule = (index: number) => {
    const currentRules = form.getValues('endpointSecurity.rules');
    const updatedRules = currentRules.filter((_, i) => i !== index);
    form.setValue('endpointSecurity.rules', updatedRules);
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabPanels = [
    'Role-Based Access Control',
    'API Key Management', 
    'Endpoint Security',
    'Advanced Settings',
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-6 flex items-center"
                >
                  <LockClosedIcon className="h-6 w-6 mr-2 text-primary-600" />
                  Security Configuration - {serviceName}
                </Dialog.Title>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Tab Navigation */}
                  <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-primary-100 dark:bg-gray-800 p-1">
                      {tabPanels.map((tab, index) => (
                        <Tab
                          key={tab}
                          className={({ selected }) =>
                            cn(
                              'w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 transition-all',
                              'ring-white/60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2',
                              selected
                                ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow'
                                : 'text-primary-600 dark:text-gray-300 hover:bg-white/20 hover:text-primary-800 dark:hover:text-white'
                            )
                          }
                        >
                          {tab}
                        </Tab>
                      ))}
                    </Tab.List>

                    <Tab.Panels className="mt-6">
                      {/* Role-Based Access Control Panel */}
                      <Tab.Panel className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <UserGroupIcon className="h-5 w-5 mr-2 text-primary-600" />
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                Role-Based Access Control
                              </h4>
                            </div>
                            <Controller
                              name="roleBasedAccess.enabled"
                              control={form.control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className={cn(
                                    field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      field.value ? 'translate-x-6' : 'translate-x-1',
                                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                    )}
                                  />
                                </Switch>
                              )}
                            />
                          </div>

                          {roleBasedEnabled && (
                            <div className="space-y-4">
                              {/* Role Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Available Roles
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {availableRoles?.map((role) => (
                                    <div
                                      key={role.id}
                                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h5 className="font-medium text-gray-900 dark:text-white">
                                            {role.name}
                                          </h5>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {role.description}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => addRoleAccess(role.id)}
                                          disabled={selectedRoles.some(r => r.roleId === role.id)}
                                          className={cn(
                                            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                                            selectedRoles.some(r => r.roleId === role.id)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                              : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800'
                                          )}
                                        >
                                          {selectedRoles.some(r => r.roleId === role.id) ? 'Added' : 'Add Role'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Selected Roles Configuration */}
                              {selectedRoles.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    Role Permissions
                                  </h5>
                                  {selectedRoles.map((roleConfig, roleIndex) => {
                                    const role = availableRoles?.find(r => r.id === roleConfig.roleId);
                                    return (
                                      <Disclosure key={roleConfig.roleId}>
                                        {({ open }) => (
                                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                                            <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-primary-500 focus-visible:ring-opacity-75">
                                              <span>{role?.name || `Role ${roleConfig.roleId}`}</span>
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeRoleAccess(roleConfig.roleId);
                                                  }}
                                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                  <TrashIcon className="h-4 w-4" />
                                                </button>
                                                <ChevronRightIcon
                                                  className={cn(
                                                    open ? 'rotate-90 transform' : '',
                                                    'h-5 w-5 text-gray-500 transition-transform'
                                                  )}
                                                />
                                              </div>
                                            </Disclosure.Button>
                                            <Disclosure.Panel className="px-4 py-4 space-y-4">
                                              {/* HTTP Methods Permission */}
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                  Allowed HTTP Methods
                                                </label>
                                                <div className="grid grid-cols-5 gap-2">
                                                  {HTTP_METHODS.map((method) => {
                                                    const isSelected = (roleConfig.permissions.verbMask & VERB_MASKS[method]) !== 0;
                                                    return (
                                                      <button
                                                        key={method}
                                                        type="button"
                                                        onClick={() => {
                                                          const currentMask = form.getValues(`roleBasedAccess.roles.${roleIndex}.permissions.verbMask`);
                                                          const newMask = isSelected
                                                            ? currentMask & ~VERB_MASKS[method]
                                                            : currentMask | VERB_MASKS[method];
                                                          form.setValue(`roleBasedAccess.roles.${roleIndex}.permissions.verbMask`, newMask);
                                                        }}
                                                        className={cn(
                                                          'px-3 py-2 rounded-md text-xs font-medium transition-colors',
                                                          isSelected
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        )}
                                                      >
                                                        {method}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* Filter Configuration */}
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                  Access Filters
                                                </label>
                                                <Controller
                                                  name={`roleBasedAccess.roles.${roleIndex}.permissions.filterOp`}
                                                  control={form.control}
                                                  render={({ field }) => (
                                                    <select
                                                      {...field}
                                                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    >
                                                      <option value="AND">AND (All filters must match)</option>
                                                      <option value="OR">OR (Any filter can match)</option>
                                                    </select>
                                                  )}
                                                />
                                              </div>
                                            </Disclosure.Panel>
                                          </div>
                                        )}
                                      </Disclosure>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Tab.Panel>

                      {/* API Key Management Panel */}
                      <Tab.Panel className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <KeyIcon className="h-5 w-5 mr-2 text-primary-600" />
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                API Key Management
                              </h4>
                            </div>
                            <Controller
                              name="apiKeyManagement.enabled"
                              control={form.control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className={cn(
                                    field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      field.value ? 'translate-x-6' : 'translate-x-1',
                                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                    )}
                                  />
                                </Switch>
                              )}
                            />
                          </div>

                          {apiKeyEnabled && (
                            <div className="space-y-6">
                              {/* API Key Settings */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                  name="apiKeyManagement.requireApiKey"
                                  control={form.control}
                                  render={({ field }) => (
                                    <div className="flex items-center space-x-3">
                                      <Switch
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className={cn(
                                          field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            field.value ? 'translate-x-6' : 'translate-x-1',
                                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                          )}
                                        />
                                      </Switch>
                                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Require API Key
                                      </label>
                                    </div>
                                  )}
                                />

                                <Controller
                                  name="apiKeyManagement.allowMultipleKeys"
                                  control={form.control}
                                  render={({ field }) => (
                                    <div className="flex items-center space-x-3">
                                      <Switch
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className={cn(
                                          field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            field.value ? 'translate-x-6' : 'translate-x-1',
                                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                          )}
                                        />
                                      </Switch>
                                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Allow Multiple Keys
                                      </label>
                                    </div>
                                  )}
                                />
                              </div>

                              {/* API Key Validation Settings */}
                              <div className="space-y-4">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  Key Validation Settings
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Controller
                                      name="apiKeyManagement.keyValidation.parameterName"
                                      control={form.control}
                                      render={({ field, fieldState }) => (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Query Parameter Name
                                          </label>
                                          <input
                                            {...field}
                                            type="text"
                                            className={cn(
                                              'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                              fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            )}
                                            placeholder="api_key"
                                          />
                                          {fieldState.error && (
                                            <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                          )}
                                        </div>
                                      )}
                                    />
                                  </div>

                                  <Controller
                                    name="apiKeyManagement.keyValidation.allowQueryParameter"
                                    control={form.control}
                                    render={({ field }) => (
                                      <div className="flex items-center space-x-3 pt-6">
                                        <Switch
                                          checked={field.value}
                                          onChange={field.onChange}
                                          className={cn(
                                            field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              field.value ? 'translate-x-6' : 'translate-x-1',
                                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                            )}
                                          />
                                        </Switch>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          Allow Query Parameter
                                        </label>
                                      </div>
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Active API Keys */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    Active API Keys
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // This would open a modal to create new API key
                                      // For now, we'll add a placeholder
                                      if (availableRoles && availableRoles.length > 0) {
                                        handleGenerateApiKey(
                                          availableRoles[0].id,
                                          `Key-${Date.now()}`,
                                          'Generated from security configuration'
                                        );
                                      }
                                    }}
                                    disabled={isGenerating}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                  >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    {isGenerating ? 'Generating...' : 'Generate Key'}
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {form.watch('apiKeyManagement.keys').map((key, index) => (
                                    <div
                                      key={index}
                                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-3">
                                            <h6 className="font-medium text-gray-900 dark:text-white">
                                              {key.name}
                                            </h6>
                                            <span className={cn(
                                              'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                              key.isActive
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            )}>
                                              {key.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {key.description}
                                          </p>
                                          <div className="flex items-center space-x-2 mt-2">
                                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                              {showApiKey[key.apiKey] ? key.apiKey : '••••••••••••••••'}
                                            </code>
                                            <button
                                              type="button"
                                              onClick={() => toggleApiKeyVisibility(key.apiKey)}
                                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                              {showApiKey[key.apiKey] ? (
                                                <EyeSlashIcon className="h-4 w-4" />
                                              ) : (
                                                <EyeIcon className="h-4 w-4" />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => copyToClipboard(key.apiKey)}
                                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                              <DocumentDuplicateIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRevokeApiKey(key.apiKey)}
                                          disabled={isRevoking}
                                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {form.watch('apiKeyManagement.keys').length === 0 && (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                      <KeyIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>No API keys configured</p>
                                      <p className="text-sm">Click "Generate Key" to create your first API key</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Tab.Panel>

                      {/* Endpoint Security Panel */}
                      <Tab.Panel className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <CogIcon className="h-5 w-5 mr-2 text-primary-600" />
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                Endpoint Security Rules
                              </h4>
                            </div>
                            <Controller
                              name="endpointSecurity.enabled"
                              control={form.control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className={cn(
                                    field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      field.value ? 'translate-x-6' : 'translate-x-1',
                                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                    )}
                                  />
                                </Switch>
                              )}
                            />
                          </div>

                          {form.watch('endpointSecurity.enabled') && (
                            <div className="space-y-6">
                              {/* Default Policy */}
                              <div>
                                <Controller
                                  name="endpointSecurity.defaultPolicy"
                                  control={form.control}
                                  render={({ field }) => (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Default Security Policy
                                      </label>
                                      <select
                                        {...field}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                      >
                                        <option value="DENY">DENY (Secure by default - explicit rules required)</option>
                                        <option value="ALLOW">ALLOW (Permissive - rules for restrictions)</option>
                                      </select>
                                    </div>
                                  )}
                                />
                              </div>

                              {/* Endpoint Rules */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    Endpoint Rules
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={addEndpointRule}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Rule
                                  </button>
                                </div>

                                <div className="space-y-4">
                                  {form.watch('endpointSecurity.rules').map((rule, index) => (
                                    <div
                                      key={index}
                                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                    >
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <Controller
                                            name={`endpointSecurity.rules.${index}.resource`}
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                  Resource Path
                                                </label>
                                                <input
                                                  {...field}
                                                  type="text"
                                                  className={cn(
                                                    'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                                    fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                  )}
                                                  placeholder="/api/v2/service/_table/*"
                                                />
                                                {fieldState.error && (
                                                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                                )}
                                              </div>
                                            )}
                                          />

                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                              HTTP Methods
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                              {HTTP_METHODS.map((method) => {
                                                const isSelected = rule.methods.includes(method);
                                                return (
                                                  <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => {
                                                      const currentMethods = form.getValues(`endpointSecurity.rules.${index}.methods`);
                                                      const newMethods = isSelected
                                                        ? currentMethods.filter(m => m !== method)
                                                        : [...currentMethods, method];
                                                      form.setValue(`endpointSecurity.rules.${index}.methods`, newMethods);
                                                    }}
                                                    className={cn(
                                                      'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                                                      isSelected
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    )}
                                                  >
                                                    {method}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => removeEndpointRule(index)}
                                          className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>

                                      {/* Security Options */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Controller
                                          name={`endpointSecurity.rules.${index}.requireAuth`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <div className="flex items-center space-x-3">
                                              <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className={cn(
                                                  field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                                )}
                                              >
                                                <span
                                                  className={cn(
                                                    field.value ? 'translate-x-6' : 'translate-x-1',
                                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                                  )}
                                                />
                                              </Switch>
                                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Require Authentication
                                              </label>
                                            </div>
                                          )}
                                        />

                                        <Controller
                                          name={`endpointSecurity.rules.${index}.requireApiKey`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <div className="flex items-center space-x-3">
                                              <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className={cn(
                                                  field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                                )}
                                              >
                                                <span
                                                  className={cn(
                                                    field.value ? 'translate-x-6' : 'translate-x-1',
                                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                                  )}
                                                />
                                              </Switch>
                                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Require API Key
                                              </label>
                                            </div>
                                          )}
                                        />

                                        <Controller
                                          name={`endpointSecurity.rules.${index}.rateLimiting.enabled`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <div className="flex items-center space-x-3">
                                              <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className={cn(
                                                  field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                                )}
                                              >
                                                <span
                                                  className={cn(
                                                    field.value ? 'translate-x-6' : 'translate-x-1',
                                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                                  )}
                                                />
                                              </Switch>
                                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Rate Limiting
                                              </label>
                                            </div>
                                          )}
                                        />
                                      </div>

                                      {/* Rate Limiting Configuration */}
                                      {rule.rateLimiting.enabled && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <Controller
                                            name={`endpointSecurity.rules.${index}.rateLimiting.requestsPerMinute`}
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                  Requests per Minute
                                                </label>
                                                <input
                                                  {...field}
                                                  type="number"
                                                  min="1"
                                                  max="10000"
                                                  className={cn(
                                                    'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                                    fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                  )}
                                                />
                                                {fieldState.error && (
                                                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                                )}
                                              </div>
                                            )}
                                          />

                                          <Controller
                                            name={`endpointSecurity.rules.${index}.rateLimiting.requestsPerHour`}
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                  Requests per Hour
                                                </label>
                                                <input
                                                  {...field}
                                                  type="number"
                                                  min="1"
                                                  max="100000"
                                                  className={cn(
                                                    'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                                    fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                  )}
                                                />
                                                {fieldState.error && (
                                                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                                )}
                                              </div>
                                            )}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                  {form.watch('endpointSecurity.rules').length === 0 && (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                      <LockClosedIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>No endpoint rules configured</p>
                                      <p className="text-sm">Click "Add Rule" to create security rules for specific endpoints</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Tab.Panel>

                      {/* Advanced Settings Panel */}
                      <Tab.Panel className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="flex items-center mb-6">
                            <CogIcon className="h-5 w-5 mr-2 text-primary-600" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Advanced Security Settings
                            </h4>
                          </div>

                          <div className="space-y-6">
                            {/* CORS Configuration */}
                            <div>
                              <Controller
                                name="advancedSettings.enableCORS"
                                control={form.control}
                                render={({ field }) => (
                                  <div className="flex items-center space-x-3 mb-4">
                                    <Switch
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className={cn(
                                        field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          field.value ? 'translate-x-6' : 'translate-x-1',
                                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                        )}
                                      />
                                    </Switch>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Enable CORS (Cross-Origin Resource Sharing)
                                    </label>
                                  </div>
                                )}
                              />

                              {form.watch('advancedSettings.enableCORS') && (
                                <Controller
                                  name="advancedSettings.corsOrigins"
                                  control={form.control}
                                  render={({ field, fieldState }) => (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Allowed Origins (one per line)
                                      </label>
                                      <textarea
                                        value={field.value.join('\n')}
                                        onChange={(e) => {
                                          const origins = e.target.value.split('\n').filter(Boolean);
                                          field.onChange(origins);
                                        }}
                                        rows={4}
                                        className={cn(
                                          'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                          fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        )}
                                        placeholder={`*\nhttps://app.example.com\nhttps://admin.example.com`}
                                      />
                                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Use * to allow all origins (not recommended for production)
                                      </p>
                                      {fieldState.error && (
                                        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                      )}
                                    </div>
                                  )}
                                />
                              )}
                            </div>

                            {/* Security Headers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Controller
                                name="advancedSettings.enableCSRF"
                                control={form.control}
                                render={({ field }) => (
                                  <div className="flex items-center space-x-3">
                                    <Switch
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className={cn(
                                        field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          field.value ? 'translate-x-6' : 'translate-x-1',
                                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                        )}
                                      />
                                    </Switch>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Enable CSRF Protection
                                    </label>
                                  </div>
                                )}
                              />

                              <Controller
                                name="advancedSettings.enableAuditLogging"
                                control={form.control}
                                render={({ field }) => (
                                  <div className="flex items-center space-x-3">
                                    <Switch
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className={cn(
                                        field.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          field.value ? 'translate-x-6' : 'translate-x-1',
                                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                                        )}
                                      />
                                    </Switch>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Enable Audit Logging
                                    </label>
                                  </div>
                                )}
                              />
                            </div>

                            {/* Session & Security Timeouts */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Controller
                                name="advancedSettings.sessionTimeout"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Session Timeout (minutes)
                                    </label>
                                    <input
                                      {...field}
                                      type="number"
                                      min="5"
                                      max="1440"
                                      className={cn(
                                        'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                        fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                      )}
                                    />
                                    {fieldState.error && (
                                      <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                    )}
                                  </div>
                                )}
                              />

                              <Controller
                                name="advancedSettings.maxFailedAttempts"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Max Failed Login Attempts
                                    </label>
                                    <input
                                      {...field}
                                      type="number"
                                      min="1"
                                      max="10"
                                      className={cn(
                                        'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                        fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                      )}
                                    />
                                    {fieldState.error && (
                                      <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                    )}
                                  </div>
                                )}
                              />

                              <Controller
                                name="advancedSettings.lockoutDuration"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Lockout Duration (minutes)
                                    </label>
                                    <input
                                      {...field}
                                      type="number"
                                      min="1"
                                      max="60"
                                      className={cn(
                                        'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm',
                                        fieldState.error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                      )}
                                    />
                                    {fieldState.error && (
                                      <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                                    )}
                                  </div>
                                )}
                              />
                            </div>

                            {/* Logging Configuration */}
                            {form.watch('advancedSettings.enableAuditLogging') && (
                              <div>
                                <Controller
                                  name="advancedSettings.logLevel"
                                  control={form.control}
                                  render={({ field }) => (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Audit Log Level
                                      </label>
                                      <select
                                        {...field}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                      >
                                        <option value="ERROR">ERROR - Only log security errors</option>
                                        <option value="WARN">WARN - Log warnings and errors</option>
                                        <option value="INFO">INFO - Log informational messages and above</option>
                                        <option value="DEBUG">DEBUG - Log all security events (verbose)</option>
                                      </select>
                                    </div>
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
                    {/* Form Errors */}
                    {form.formState.errors.root && (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm">{form.formState.errors.root.message}</span>
                      </div>
                    )}

                    <div className="flex space-x-3 ml-auto">
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !form.formState.isValid}
                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}