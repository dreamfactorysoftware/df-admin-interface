'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ExclamationTriangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Security Configuration Types
interface SecurityRule {
  id: string;
  name: string;
  type: 'authentication' | 'authorization' | 'rate_limiting' | 'ip_filtering' | 'cors';
  enabled: boolean;
  configuration: Record<string, any>;
  priority: number;
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    execute: boolean;
  };
  conditions?: {
    fieldFilters?: Record<string, any>;
    recordFilters?: string;
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
    };
  };
}

interface ApiKeyConfig {
  enabled: boolean;
  keyType: 'header' | 'query' | 'cookie';
  keyName: string;
  keyFormat: 'uuid' | 'jwt' | 'custom';
  rotation: {
    enabled: boolean;
    intervalDays: number;
    notifyBeforeExpiry: boolean;
    notifyDays: number;
  };
  scopes: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

interface SessionConfig {
  enabled: boolean;
  tokenType: 'jwt' | 'opaque';
  expirationMinutes: number;
  refreshEnabled: boolean;
  refreshWindowMinutes: number;
  maxConcurrentSessions: number;
  requireReauth: boolean;
  reauthTimeoutMinutes: number;
}

interface SecurityValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  complianceScore: number;
}

// Validation Schema
const securityConfigSchema = z.object({
  authenticationRequired: z.boolean(),
  authenticationMethods: z.array(z.enum(['api_key', 'session_token', 'basic_auth', 'oauth2', 'bearer_token'])),
  
  // Role-based Access Control
  rbacEnabled: z.boolean(),
  defaultRole: z.string().optional(),
  rolePermissions: z.array(z.object({
    roleId: z.string(),
    roleName: z.string(),
    permissions: z.object({
      read: z.boolean(),
      create: z.boolean(),
      update: z.boolean(),
      delete: z.boolean(),
      execute: z.boolean(),
    }),
    conditions: z.object({
      fieldFilters: z.record(z.any()).optional(),
      recordFilters: z.string().optional(),
      timeRestrictions: z.object({
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      }).optional(),
    }).optional(),
  })),

  // API Key Configuration
  apiKeyConfig: z.object({
    enabled: z.boolean(),
    keyType: z.enum(['header', 'query', 'cookie']),
    keyName: z.string().min(1, 'Key name is required'),
    keyFormat: z.enum(['uuid', 'jwt', 'custom']),
    rotation: z.object({
      enabled: z.boolean(),
      intervalDays: z.number().min(1).max(365),
      notifyBeforeExpiry: z.boolean(),
      notifyDays: z.number().min(1).max(30),
    }),
    scopes: z.array(z.string()),
    rateLimit: z.object({
      requestsPerMinute: z.number().min(1),
      requestsPerHour: z.number().min(1),
      requestsPerDay: z.number().min(1),
    }).optional(),
  }),

  // Session Configuration
  sessionConfig: z.object({
    enabled: z.boolean(),
    tokenType: z.enum(['jwt', 'opaque']),
    expirationMinutes: z.number().min(5).max(43200), // 5 minutes to 30 days
    refreshEnabled: z.boolean(),
    refreshWindowMinutes: z.number().min(5),
    maxConcurrentSessions: z.number().min(1).max(100),
    requireReauth: z.boolean(),
    reauthTimeoutMinutes: z.number().min(5),
  }),

  // Security Rules
  securityRules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['authentication', 'authorization', 'rate_limiting', 'ip_filtering', 'cors']),
    enabled: z.boolean(),
    configuration: z.record(z.any()),
    priority: z.number(),
  })),

  // Advanced Security Options
  requireHttps: z.boolean(),
  enableCors: z.boolean(),
  corsOrigins: z.array(z.string()),
  enableAuditLogging: z.boolean(),
  enableThreatDetection: z.boolean(),
  failureThreshold: z.number().min(3).max(50),
  lockoutDurationMinutes: z.number().min(5).max(1440),
});

type SecurityConfigFormData = z.infer<typeof securityConfigSchema>;

// Default form values
const defaultValues: SecurityConfigFormData = {
  authenticationRequired: true,
  authenticationMethods: ['session_token'],
  rbacEnabled: true,
  defaultRole: '',
  rolePermissions: [],
  apiKeyConfig: {
    enabled: false,
    keyType: 'header',
    keyName: 'X-API-Key',
    keyFormat: 'uuid',
    rotation: {
      enabled: false,
      intervalDays: 90,
      notifyBeforeExpiry: true,
      notifyDays: 7,
    },
    scopes: [],
  },
  sessionConfig: {
    enabled: true,
    tokenType: 'jwt',
    expirationMinutes: 480, // 8 hours
    refreshEnabled: true,
    refreshWindowMinutes: 60,
    maxConcurrentSessions: 3,
    requireReauth: false,
    reauthTimeoutMinutes: 60,
  },
  securityRules: [],
  requireHttps: true,
  enableCors: false,
  corsOrigins: [],
  enableAuditLogging: true,
  enableThreatDetection: true,
  failureThreshold: 5,
  lockoutDurationMinutes: 15,
};

// Available roles (would typically come from API)
const availableRoles = [
  { id: 'admin', name: 'Administrator', description: 'Full system access' },
  { id: 'developer', name: 'Developer', description: 'API development access' },
  { id: 'user', name: 'User', description: 'Standard user access' },
  { id: 'readonly', name: 'Read Only', description: 'Read-only access' },
];

// Available scopes for API keys
const availableScopes = [
  'read:endpoints',
  'write:endpoints',
  'delete:endpoints',
  'read:schema',
  'write:schema',
  'admin:system',
  'admin:users',
  'admin:roles',
];

interface SecurityConfigurationProps {
  endpointId?: string;
  initialConfig?: Partial<SecurityConfigFormData>;
  onConfigChange?: (config: SecurityConfigFormData) => void;
  onValidationChange?: (result: SecurityValidationResult) => void;
  disabled?: boolean;
  className?: string;
}

export default function SecurityConfiguration({
  endpointId,
  initialConfig,
  onConfigChange,
  onValidationChange,
  disabled = false,
  className = '',
}: SecurityConfigurationProps) {
  const [validationResult, setValidationResult] = useState<SecurityValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
    suggestions: [],
    complianceScore: 85,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<SecurityConfigFormData>({
    resolver: zodResolver(securityConfigSchema),
    defaultValues: { ...defaultValues, ...initialConfig },
    mode: 'onChange',
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isValid } } = form;

  // Watch form values for real-time validation
  const formValues = useWatch({ control });
  const authenticationRequired = watch('authenticationRequired');
  const rbacEnabled = watch('rbacEnabled');
  const apiKeyEnabled = watch('apiKeyConfig.enabled');
  const sessionEnabled = watch('sessionConfig.enabled');

  // Real-time security validation
  const validateSecurityConfig = useCallback(async (config: SecurityConfigFormData) => {
    setIsValidating(true);
    
    try {
      // Simulate validation delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const warnings: string[] = [];
      const errors: string[] = [];
      const suggestions: string[] = [];
      let complianceScore = 100;

      // Authentication validation
      if (!config.authenticationRequired) {
        warnings.push('Authentication is disabled - this may pose security risks');
        complianceScore -= 20;
      }

      if (config.authenticationRequired && config.authenticationMethods.length === 0) {
        errors.push('At least one authentication method must be selected');
        complianceScore -= 30;
      }

      // RBAC validation
      if (config.rbacEnabled && config.rolePermissions.length === 0) {
        warnings.push('RBAC is enabled but no role permissions are configured');
        complianceScore -= 15;
      }

      // API Key validation
      if (config.apiKeyConfig.enabled) {
        if (!config.apiKeyConfig.keyName) {
          errors.push('API key name is required when API key authentication is enabled');
          complianceScore -= 25;
        }
        
        if (!config.apiKeyConfig.rotation.enabled) {
          suggestions.push('Consider enabling API key rotation for enhanced security');
          complianceScore -= 5;
        }
      }

      // Session validation
      if (config.sessionConfig.enabled) {
        if (config.sessionConfig.expirationMinutes > 1440) {
          warnings.push('Session expiration longer than 24 hours may pose security risks');
          complianceScore -= 10;
        }
        
        if (!config.sessionConfig.refreshEnabled) {
          suggestions.push('Consider enabling session refresh for better user experience');
        }
      }

      // HTTPS validation
      if (!config.requireHttps) {
        errors.push('HTTPS must be required for secure API endpoints');
        complianceScore -= 35;
      }

      // Threat detection validation
      if (!config.enableThreatDetection) {
        suggestions.push('Enable threat detection for enhanced security monitoring');
        complianceScore -= 5;
      }

      // Audit logging validation
      if (!config.enableAuditLogging) {
        suggestions.push('Enable audit logging for compliance and security monitoring');
        complianceScore -= 10;
      }

      const result: SecurityValidationResult = {
        isValid: errors.length === 0,
        warnings,
        errors,
        suggestions,
        complianceScore: Math.max(0, Math.min(100, complianceScore)),
      };

      setValidationResult(result);
      onValidationChange?.(result);
    } catch (error) {
      console.error('Security validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);

  // Trigger validation when form values change
  useEffect(() => {
    if (formValues) {
      validateSecurityConfig(formValues);
      onConfigChange?.(formValues);
    }
  }, [formValues, validateSecurityConfig, onConfigChange]);

  // Add new role permission
  const addRolePermission = useCallback(() => {
    const currentPermissions = watch('rolePermissions');
    const newPermission: RolePermission = {
      roleId: '',
      roleName: '',
      permissions: {
        read: true,
        create: false,
        update: false,
        delete: false,
        execute: false,
      },
    };
    setValue('rolePermissions', [...currentPermissions, newPermission]);
  }, [watch, setValue]);

  // Remove role permission
  const removeRolePermission = useCallback((index: number) => {
    const currentPermissions = watch('rolePermissions');
    setValue('rolePermissions', currentPermissions.filter((_, i) => i !== index));
  }, [watch, setValue]);

  // Add security rule
  const addSecurityRule = useCallback(() => {
    const currentRules = watch('securityRules');
    const newRule: SecurityRule = {
      id: `rule_${Date.now()}`,
      name: 'New Security Rule',
      type: 'authentication',
      enabled: true,
      configuration: {},
      priority: currentRules.length + 1,
    };
    setValue('securityRules', [...currentRules, newRule]);
  }, [watch, setValue]);

  // Remove security rule
  const removeSecurityRule = useCallback((index: number) => {
    const currentRules = watch('securityRules');
    setValue('securityRules', currentRules.filter((_, i) => i !== index));
  }, [watch, setValue]);

  const onSubmit = (data: SecurityConfigFormData) => {
    onConfigChange?.(data);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Validation Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure authentication, authorization, and security rules for this endpoint
            </p>
          </div>
        </div>
        
        {/* Compliance Score */}
        <div className="flex items-center space-x-3">
          {isValidating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Validating...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                validationResult.complianceScore >= 90 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : validationResult.complianceScore >= 70
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                Security Score: {validationResult.complianceScore}%
              </div>
              {validationResult.isValid ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {(validationResult.errors.length > 0 || validationResult.warnings.length > 0 || validationResult.suggestions.length > 0) && (
        <div className="space-y-2">
          {validationResult.errors.map((error, index) => (
            <div key={`error-${index}`} className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          ))}
          
          {validationResult.warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</span>
            </div>
          ))}
          
          {validationResult.suggestions.map((suggestion, index) => (
            <div key={`suggestion-${index}`} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-blue-800 dark:text-blue-200">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Authentication Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <KeyIcon className="h-5 w-5 mr-2" />
            Authentication Settings
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Controller
                name="authenticationRequired"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Require Authentication
                    </span>
                  </label>
                )}
              />
            </div>

            {authenticationRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Authentication Methods
                </label>
                <Controller
                  name="authenticationMethods"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      {[
                        { value: 'session_token', label: 'Session Token' },
                        { value: 'api_key', label: 'API Key' },
                        { value: 'basic_auth', label: 'Basic Authentication' },
                        { value: 'bearer_token', label: 'Bearer Token' },
                        { value: 'oauth2', label: 'OAuth 2.0' },
                      ].map((method) => (
                        <label key={method.value} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value.includes(method.value as any)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, method.value]);
                              } else {
                                field.onChange(field.value.filter((v: string) => v !== method.value));
                              }
                            }}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-900 dark:text-white">
                            {method.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.authenticationMethods && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.authenticationMethods.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role-Based Access Control */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Role-Based Access Control
            </h4>
            <Controller
              name="rbacEnabled"
              control={control}
              render={({ field }) => (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    Enable RBAC
                  </span>
                </label>
              )}
            />
          </div>

          {rbacEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Role (for unauthenticated users)
                </label>
                <Controller
                  name="defaultRole"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={disabled}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">No default role</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role Permissions
                  </label>
                  <button
                    type="button"
                    onClick={addRolePermission}
                    disabled={disabled}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-200 dark:hover:bg-primary-800"
                  >
                    Add Role
                  </button>
                </div>

                <Controller
                  name="rolePermissions"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {field.value.map((rolePermission, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Role
                                </label>
                                <select
                                  value={rolePermission.roleId}
                                  onChange={(e) => {
                                    const selectedRole = availableRoles.find(r => r.id === e.target.value);
                                    const updatedPermissions = [...field.value];
                                    updatedPermissions[index] = {
                                      ...updatedPermissions[index],
                                      roleId: e.target.value,
                                      roleName: selectedRole?.name || '',
                                    };
                                    field.onChange(updatedPermissions);
                                  }}
                                  disabled={disabled}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                                >
                                  <option value="">Select Role</option>
                                  {availableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRolePermission(index)}
                              disabled={disabled}
                              className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Permissions
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                              {Object.entries(rolePermission.permissions).map(([permission, enabled]) => (
                                <label key={permission} className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) => {
                                      const updatedPermissions = [...field.value];
                                      updatedPermissions[index] = {
                                        ...updatedPermissions[index],
                                        permissions: {
                                          ...updatedPermissions[index].permissions,
                                          [permission]: e.target.checked,
                                        },
                                      };
                                      field.onChange(updatedPermissions);
                                    }}
                                    disabled={disabled}
                                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 text-xs text-gray-900 dark:text-white capitalize">
                                    {permission}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* API Key Configuration */}
        {authenticationRequired && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                API Key Configuration
              </h4>
              <Controller
                name="apiKeyConfig.enabled"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Enable API Keys
                    </span>
                  </label>
                )}
              />
            </div>

            {apiKeyEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Location
                    </label>
                    <Controller
                      name="apiKeyConfig.keyType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={disabled}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="header">Header</option>
                          <option value="query">Query Parameter</option>
                          <option value="cookie">Cookie</option>
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Name
                    </label>
                    <Controller
                      name="apiKeyConfig.keyName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          disabled={disabled}
                          placeholder="X-API-Key"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      )}
                    />
                    {errors.apiKeyConfig?.keyName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.apiKeyConfig.keyName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Format
                    </label>
                    <Controller
                      name="apiKeyConfig.keyFormat"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={disabled}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="uuid">UUID</option>
                          <option value="jwt">JWT</option>
                          <option value="custom">Custom</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* API Key Rotation */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      Key Rotation
                    </h5>
                    <Controller
                      name="apiKeyConfig.rotation.enabled"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            Enable Rotation
                          </span>
                        </label>
                      )}
                    />
                  </div>

                  {watch('apiKeyConfig.rotation.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rotation Interval (days)
                        </label>
                        <Controller
                          name="apiKeyConfig.rotation.intervalDays"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="1"
                              max="365"
                              disabled={disabled}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notify Before Expiry (days)
                        </label>
                        <Controller
                          name="apiKeyConfig.rotation.notifyDays"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="1"
                              max="30"
                              disabled={disabled}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session Configuration */}
        {authenticationRequired && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Session Configuration
              </h4>
              <Controller
                name="sessionConfig.enabled"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Enable Sessions
                    </span>
                  </label>
                )}
              />
            </div>

            {sessionEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token Type
                    </label>
                    <Controller
                      name="sessionConfig.tokenType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={disabled}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="jwt">JWT (JSON Web Token)</option>
                          <option value="opaque">Opaque Token</option>
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiration (minutes)
                    </label>
                    <Controller
                      name="sessionConfig.expirationMinutes"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="5"
                          max="43200"
                          disabled={disabled}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Controller
                      name="sessionConfig.refreshEnabled"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-900 dark:text-white">
                            Enable Token Refresh
                          </span>
                        </label>
                      )}
                    />
                  </div>

                  <div className="flex items-center">
                    <Controller
                      name="sessionConfig.requireReauth"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-900 dark:text-white">
                            Require Re-authentication
                          </span>
                        </label>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Security Options */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Advanced Security Options
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Controller
                  name="requireHttps"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                        Require HTTPS
                      </span>
                    </label>
                  )}
                />
              </div>

              <div className="flex items-center">
                <Controller
                  name="enableAuditLogging"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                        Enable Audit Logging
                      </span>
                    </label>
                  )}
                />
              </div>

              <div className="flex items-center">
                <Controller
                  name="enableThreatDetection"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                        Enable Threat Detection
                      </span>
                    </label>
                  )}
                />
              </div>

              <div className="flex items-center">
                <Controller
                  name="enableCors"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                        Enable CORS
                      </span>
                    </label>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Failure Threshold
                </label>
                <Controller
                  name="failureThreshold"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="3"
                      max="50"
                      disabled={disabled}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of failed attempts before lockout
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lockout Duration (minutes)
                </label>
                <Controller
                  name="lockoutDurationMinutes"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="5"
                      max="1440"
                      disabled={disabled}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Duration to lock out after threshold reached
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isValid ? (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Configuration is valid
              </span>
            ) : (
              <span className="flex items-center text-red-600 dark:text-red-400">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Please fix validation errors
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => form.reset(defaultValues)}
              disabled={disabled}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={disabled || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}