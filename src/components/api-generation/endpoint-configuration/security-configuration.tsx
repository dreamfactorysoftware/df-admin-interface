/**
 * @fileoverview Security Configuration Component for API Endpoints
 * 
 * Comprehensive security configuration interface implementing authentication requirements,
 * authorization rules, and access control settings for generated API endpoints. Integrates
 * with Next.js middleware patterns for security rule validation and enforcement.
 * 
 * Migration Context:
 * - Replaces Angular guards with Next.js middleware-based security patterns
 * - Implements React Hook Form with Zod validation for security configuration forms
 * - Integrates SWR/React Query for real-time security rule caching and validation
 * - Provides role-based access control with hierarchical permission management
 * - Supports API key authentication with secure generation and rotation capabilities
 * 
 * Key Features:
 * - Role-based access control configuration with granular permissions
 * - API key generation, rotation, and management with secure storage
 * - Security rule validation with real-time feedback (sub-100ms requirement)
 * - Session token management with configurable expiration settings
 * - Audit logging integration with sub-50ms performance requirement
 * - Next.js middleware rule evaluation for security enforcement
 * - WCAG 2.1 AA accessibility compliance throughout the interface
 * 
 * Performance Requirements:
 * - Security rule evaluation latency under 100ms via Next.js middleware
 * - Audit log write latency under 50ms for compliance tracking
 * - Real-time validation feedback under 100ms for user experience
 * - Form submission processing under 2 seconds with loading states
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 * @see Technical Specification Section F-004 - API Security Configuration
 * @see Technical Specification Section 4.5 - Security and Authentication Flows
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  RefreshIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  LockClosedIcon,
  UnlockOpenIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Security Configuration Types
 * 
 * Comprehensive type definitions for security configuration including
 * authentication methods, authorization rules, and access control settings.
 */

/**
 * Authentication Method Types
 */
export type AuthMethod = 'none' | 'api_key' | 'session_token' | 'oauth2' | 'custom';

/**
 * Permission Level Types for Role-Based Access Control
 */
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

/**
 * HTTP Method Types for Endpoint Security
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Security Rule Type Definitions
 */
export type SecurityRuleType = 'endpoint' | 'resource' | 'field' | 'custom';

/**
 * API Key Configuration Interface
 */
export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  description?: string;
  enabled: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsed?: Date;
  permissions: PermissionLevel[];
  ipWhitelist?: string[];
  rateLimitRpm?: number;
}

/**
 * Role Permission Interface
 */
export interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: {
    [method in HttpMethod]?: PermissionLevel;
  };
  resourceLimits?: {
    maxRecords?: number;
    allowedFields?: string[];
    deniedFields?: string[];
  };
}

/**
 * Security Rule Interface
 */
export interface SecurityRule {
  id: string;
  name: string;
  type: SecurityRuleType;
  enabled: boolean;
  condition: string;
  action: 'allow' | 'deny' | 'require_auth' | 'custom';
  priority: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session Configuration Interface
 */
export interface SessionConfig {
  enabled: boolean;
  expirationMinutes: number;
  refreshEnabled: boolean;
  refreshThresholdMinutes: number;
  maxConcurrentSessions: number;
  requireReauth: boolean;
  ipValidation: boolean;
  userAgentValidation: boolean;
}

/**
 * Security Test Result Interface
 */
export interface SecurityTestResult {
  passed: boolean;
  testType: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number;
}

/**
 * Main Security Configuration Interface
 */
export interface SecurityConfiguration {
  id?: string;
  endpointId: string;
  serviceName: string;
  
  // Authentication Configuration
  authMethod: AuthMethod;
  requireAuthentication: boolean;
  apiKeys: ApiKeyConfig[];
  
  // Authorization Configuration
  rolePermissions: RolePermission[];
  customRoles: string[];
  inheritFromParent: boolean;
  
  // Security Rules
  securityRules: SecurityRule[];
  enableRateLimiting: boolean;
  rateLimitRpm: number;
  
  // Session Management
  sessionConfig: SessionConfig;
  
  // Audit and Monitoring
  enableAuditLogging: boolean;
  auditEvents: string[];
  
  // Advanced Settings
  enableCors: boolean;
  corsOrigins: string[];
  enableSsl: boolean;
  customHeaders: Record<string, string>;
  
  // Testing
  testResults?: SecurityTestResult[];
  lastTested?: Date;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  version?: number;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

/**
 * Zod Validation Schema for Security Configuration
 * 
 * Comprehensive validation schema ensuring data integrity and security
 * compliance for all configuration options.
 */
const securityConfigurationSchema = z.object({
  endpointId: z.string().min(1, 'Endpoint ID is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  
  // Authentication Configuration
  authMethod: z.enum(['none', 'api_key', 'session_token', 'oauth2', 'custom'], {
    required_error: 'Authentication method is required'
  }),
  requireAuthentication: z.boolean(),
  
  // API Key Configuration
  apiKeys: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'API key name is required'),
    key: z.string().min(32, 'API key must be at least 32 characters'),
    description: z.string().optional(),
    enabled: z.boolean(),
    expiresAt: z.date().optional(),
    permissions: z.array(z.enum(['none', 'read', 'write', 'admin'])),
    ipWhitelist: z.array(z.string().ip()).optional(),
    rateLimitRpm: z.number().min(1).max(10000).optional()
  })),
  
  // Role-Based Access Control
  rolePermissions: z.array(z.object({
    roleId: z.string().min(1, 'Role ID is required'),
    roleName: z.string().min(1, 'Role name is required'),
    permissions: z.record(z.enum(['none', 'read', 'write', 'admin'])),
    resourceLimits: z.object({
      maxRecords: z.number().min(1).optional(),
      allowedFields: z.array(z.string()).optional(),
      deniedFields: z.array(z.string()).optional()
    }).optional()
  })),
  
  customRoles: z.array(z.string()),
  inheritFromParent: z.boolean(),
  
  // Security Rules
  securityRules: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Security rule name is required'),
    type: z.enum(['endpoint', 'resource', 'field', 'custom']),
    enabled: z.boolean(),
    condition: z.string().min(1, 'Security rule condition is required'),
    action: z.enum(['allow', 'deny', 'require_auth', 'custom']),
    priority: z.number().min(1).max(100),
    description: z.string().optional()
  })),
  
  // Rate Limiting
  enableRateLimiting: z.boolean(),
  rateLimitRpm: z.number().min(1).max(10000).when('enableRateLimiting', {
    is: true,
    then: (schema) => schema,
    otherwise: (schema) => schema.optional()
  }),
  
  // Session Configuration
  sessionConfig: z.object({
    enabled: z.boolean(),
    expirationMinutes: z.number().min(5).max(10080), // 5 minutes to 1 week
    refreshEnabled: z.boolean(),
    refreshThresholdMinutes: z.number().min(1).max(60),
    maxConcurrentSessions: z.number().min(1).max(100),
    requireReauth: z.boolean(),
    ipValidation: z.boolean(),
    userAgentValidation: z.boolean()
  }),
  
  // Audit and Monitoring
  enableAuditLogging: z.boolean(),
  auditEvents: z.array(z.string()),
  
  // CORS Configuration
  enableCors: z.boolean(),
  corsOrigins: z.array(z.string().url().or(z.literal('*'))).when('enableCors', {
    is: true,
    then: (schema) => schema.min(1, 'At least one CORS origin is required'),
    otherwise: (schema) => schema.optional()
  }),
  
  // SSL Configuration
  enableSsl: z.boolean(),
  
  // Custom Headers
  customHeaders: z.record(z.string(), z.string())
});

type SecurityConfigurationFormData = z.infer<typeof securityConfigurationSchema>;

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Security Configuration Component Props
 */
export interface SecurityConfigurationProps {
  /** Endpoint ID for which to configure security */
  endpointId: string;
  
  /** Service name associated with the endpoint */
  serviceName: string;
  
  /** Initial configuration data */
  initialConfig?: Partial<SecurityConfiguration>;
  
  /** Available roles for assignment */
  availableRoles?: Array<{ id: string; name: string; description?: string; }>;
  
  /** Available audit events for selection */
  availableAuditEvents?: string[];
  
  /** Callback fired when configuration is saved */
  onSave?: (config: SecurityConfiguration) => void | Promise<void>;
  
  /** Callback fired when configuration changes */
  onChange?: (config: Partial<SecurityConfiguration>) => void;
  
  /** Callback fired when security test is requested */
  onTest?: (config: SecurityConfiguration) => Promise<SecurityTestResult[]>;
  
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
  
  /** Loading state for external operations */
  loading?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** CSS class name for styling */
  className?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a secure API key
 */
const generateApiKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate security rule condition syntax
 */
const validateSecurityRule = (condition: string): { valid: boolean; error?: string } => {
  try {
    // Basic syntax validation for security rule conditions
    // In a real implementation, this would parse the condition syntax
    if (!condition.trim()) {
      return { valid: false, error: 'Condition cannot be empty' };
    }
    
    if (condition.length > 1000) {
      return { valid: false, error: 'Condition is too long (max 1000 characters)' };
    }
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [/eval\s*\(/i, /function\s*\(/i, /setTimeout/i, /setInterval/i];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(condition)) {
        return { valid: false, error: 'Condition contains potentially dangerous code' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid condition syntax' };
  }
};

/**
 * Format permission level for display
 */
const formatPermissionLevel = (level: PermissionLevel): string => {
  const labels: Record<PermissionLevel, string> = {
    none: 'No Access',
    read: 'Read Only',
    write: 'Read/Write',
    admin: 'Full Admin'
  };
  return labels[level];
};

/**
 * Get permission level color for UI styling
 */
const getPermissionColor = (level: PermissionLevel): string => {
  const colors: Record<PermissionLevel, string> = {
    none: 'text-gray-500 bg-gray-100',
    read: 'text-blue-700 bg-blue-100',
    write: 'text-green-700 bg-green-100',
    admin: 'text-red-700 bg-red-100'
  };
  return colors[level];
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Security Configuration Component
 * 
 * Comprehensive interface for configuring API endpoint security including
 * authentication methods, authorization rules, and access control settings.
 */
export const SecurityConfiguration: React.FC<SecurityConfigurationProps> = ({
  endpointId,
  serviceName,
  initialConfig,
  availableRoles = [],
  availableAuditEvents = [],
  onSave,
  onChange,
  onTest,
  readOnly = false,
  loading = false,
  error,
  className
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [activeSection, setActiveSection] = useState<string>('authentication');
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  // =============================================================================
  // FORM CONFIGURATION
  // =============================================================================
  
  const form = useForm<SecurityConfigurationFormData>({
    resolver: zodResolver(securityConfigurationSchema),
    defaultValues: {
      endpointId,
      serviceName,
      authMethod: 'api_key',
      requireAuthentication: true,
      apiKeys: [],
      rolePermissions: [],
      customRoles: [],
      inheritFromParent: false,
      securityRules: [],
      enableRateLimiting: false,
      rateLimitRpm: 1000,
      sessionConfig: {
        enabled: true,
        expirationMinutes: 480, // 8 hours
        refreshEnabled: true,
        refreshThresholdMinutes: 30,
        maxConcurrentSessions: 5,
        requireReauth: false,
        ipValidation: false,
        userAgentValidation: false
      },
      enableAuditLogging: true,
      auditEvents: ['auth', 'access', 'error'],
      enableCors: false,
      corsOrigins: [],
      enableSsl: true,
      customHeaders: {},
      ...initialConfig
    },
    mode: 'onChange'
  });
  
  const { 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isDirty, isValid }
  } = form;
  
  // Field Arrays for dynamic form sections
  const apiKeysArray = useFieldArray({
    control,
    name: 'apiKeys'
  });
  
  const rolePermissionsArray = useFieldArray({
    control,
    name: 'rolePermissions'
  });
  
  const securityRulesArray = useFieldArray({
    control,
    name: 'securityRules'
  });
  
  // Watch form values for real-time updates
  const watchedValues = watch();
  
  // =============================================================================
  // DATA FETCHING
  // =============================================================================
  
  // Fetch current security configuration
  const { data: currentConfig, mutate: mutateConfig } = useSWR(
    `/api/security/endpoints/${endpointId}`,
    {
      fallbackData: initialConfig,
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30 seconds
    }
  );
  
  // Fetch available roles if not provided
  const { data: roles } = useSWR(
    availableRoles.length === 0 ? '/api/security/roles' : null,
    {
      fallbackData: availableRoles,
      revalidateOnFocus: false
    }
  );
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle form submission
   */
  const onSubmit = useCallback(async (data: SecurityConfigurationFormData) => {
    try {
      const config: SecurityConfiguration = {
        ...data,
        id: currentConfig?.id,
        createdAt: currentConfig?.createdAt || new Date(),
        updatedAt: new Date(),
        version: (currentConfig?.version || 0) + 1
      };
      
      if (onSave) {
        await onSave(config);
      }
      
      // Update local cache
      await mutateConfig(config);
      
    } catch (error) {
      console.error('Failed to save security configuration:', error);
    }
  }, [currentConfig, onSave, mutateConfig]);
  
  /**
   * Handle configuration changes
   */
  const handleConfigChange = useCallback((changes: Partial<SecurityConfigurationFormData>) => {
    if (onChange) {
      onChange(changes);
    }
  }, [onChange]);
  
  /**
   * Handle security testing
   */
  const handleSecurityTest = useCallback(async () => {
    if (!onTest) return;
    
    setTestingInProgress(true);
    try {
      const config: SecurityConfiguration = {
        ...watchedValues,
        id: currentConfig?.id,
        endpointId,
        serviceName
      };
      
      const results = await onTest(config);
      setTestResults(results);
    } catch (error) {
      console.error('Security test failed:', error);
      setTestResults([{
        passed: false,
        testType: 'general',
        message: 'Security test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date(),
        duration: 0
      }]);
    } finally {
      setTestingInProgress(false);
    }
  }, [watchedValues, currentConfig, endpointId, serviceName, onTest]);
  
  /**
   * Add new API key
   */
  const handleAddApiKey = useCallback(() => {
    const newApiKey: ApiKeyConfig = {
      id: crypto.randomUUID(),
      name: `API Key ${apiKeysArray.fields.length + 1}`,
      key: generateApiKey(),
      enabled: true,
      createdAt: new Date(),
      permissions: ['read']
    };
    
    apiKeysArray.append(newApiKey);
  }, [apiKeysArray]);
  
  /**
   * Regenerate API key
   */
  const handleRegenerateApiKey = useCallback((index: number) => {
    const currentKey = apiKeysArray.fields[index];
    setValue(`apiKeys.${index}.key`, generateApiKey());
    setValue(`apiKeys.${index}.createdAt`, new Date());
  }, [apiKeysArray.fields, setValue]);
  
  /**
   * Add new role permission
   */
  const handleAddRolePermission = useCallback(() => {
    const availableRolesList = roles || availableRoles;
    if (availableRolesList.length === 0) return;
    
    const newRolePermission: RolePermission = {
      roleId: availableRolesList[0].id,
      roleName: availableRolesList[0].name,
      permissions: {
        GET: 'read',
        POST: 'none',
        PUT: 'none',
        PATCH: 'none',
        DELETE: 'none'
      }
    };
    
    rolePermissionsArray.append(newRolePermission);
  }, [roles, availableRoles, rolePermissionsArray]);
  
  /**
   * Add new security rule
   */
  const handleAddSecurityRule = useCallback(() => {
    const newRule: SecurityRule = {
      id: crypto.randomUUID(),
      name: `Security Rule ${securityRulesArray.fields.length + 1}`,
      type: 'endpoint',
      enabled: true,
      condition: 'request.method === "GET"',
      action: 'allow',
      priority: 50,
      description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    securityRulesArray.append(newRule);
  }, [securityRulesArray]);
  
  // =============================================================================
  // COMPONENT SECTIONS
  // =============================================================================
  
  /**
   * Authentication Configuration Section
   */
  const AuthenticationSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <LockClosedIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Authentication Configuration</h3>
      </div>
      
      {/* Authentication Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authentication Method
          </label>
          <Controller
            name="authMethod"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                disabled={readOnly}
                className={cn(
                  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "disabled:bg-gray-50 disabled:text-gray-500",
                  errors.authMethod && "border-red-300 focus:ring-red-500 focus:border-red-500"
                )}
              >
                <option value="none">No Authentication</option>
                <option value="api_key">API Key</option>
                <option value="session_token">Session Token</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="custom">Custom</option>
              </select>
            )}
          />
          {errors.authMethod && (
            <p className="mt-1 text-sm text-red-600">{errors.authMethod.message}</p>
          )}
        </div>
        
        <div className="flex items-center">
          <Controller
            name="requireAuthentication"
            control={control}
            render={({ field: { value, onChange } }) => (
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={readOnly}
                  className={cn(
                    "w-4 h-4 text-blue-600 border-gray-300 rounded",
                    "focus:ring-2 focus:ring-blue-500",
                    "disabled:opacity-50"
                  )}
                />
                <span className="text-sm font-medium text-gray-700">
                  Require Authentication
                </span>
              </label>
            )}
          />
        </div>
      </div>
      
      {/* API Keys Management */}
      {watchedValues.authMethod === 'api_key' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <KeyIcon className="w-4 h-4 text-gray-500" />
              <h4 className="text-md font-medium text-gray-900">API Keys</h4>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleAddApiKey}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 border border-transparent",
                  "text-xs font-medium rounded text-blue-700 bg-blue-100",
                  "hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "transition-colors duration-200"
                )}
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                Add API Key
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {apiKeysArray.fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Controller
                    name={`apiKeys.${index}.name`}
                    control={control}
                    render={({ field: nameField }) => (
                      <input
                        {...nameField}
                        placeholder="API Key Name"
                        disabled={readOnly}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      />
                    )}
                  />
                  
                  {!readOnly && (
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        type="button"
                        onClick={() => handleRegenerateApiKey(index)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Regenerate API Key"
                      >
                        <RefreshIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => apiKeysArray.remove(index)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete API Key"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name={`apiKeys.${index}.key`}
                        control={control}
                        render={({ field: keyField }) => (
                          <input
                            {...keyField}
                            type={showApiKeys ? 'text' : 'password'}
                            readOnly
                            className="flex-1 px-3 py-1.5 text-xs font-mono bg-gray-50 border border-gray-300 rounded"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeys(!showApiKeys)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showApiKeys ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Controller
                      name={`apiKeys.${index}.enabled`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={readOnly}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">Enabled</span>
                        </label>
                      )}
                    />
                  </div>
                </div>
                
                <Controller
                  name={`apiKeys.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="Description (optional)"
                      disabled={readOnly}
                      rows={2}
                      className={cn(
                        "mt-3 w-full px-3 py-2 text-sm border border-gray-300 rounded",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
                        "disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                      )}
                    />
                  )}
                />
              </div>
            ))}
            
            {apiKeysArray.fields.length === 0 && (
              <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <KeyIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No API keys configured</p>
                <p className="text-xs text-gray-400">Add an API key to enable key-based authentication</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  /**
   * Authorization Configuration Section
   */
  const AuthorizationSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserGroupIcon className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-medium text-gray-900">Authorization Configuration</h3>
      </div>
      
      {/* Role-Based Permissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900">Role-Based Permissions</h4>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddRolePermission}
              disabled={(roles || availableRoles).length === 0}
              className={cn(
                "inline-flex items-center px-3 py-1.5 border border-transparent",
                "text-xs font-medium rounded text-green-700 bg-green-100",
                "hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              )}
            >
              <PlusIcon className="w-3 h-3 mr-1" />
              Add Role Permission
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {rolePermissionsArray.fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <Controller
                    name={`rolePermissions.${index}.roleId`}
                    control={control}
                    render={({ field: roleField }) => (
                      <select
                        {...roleField}
                        disabled={readOnly}
                        onChange={(e) => {
                          const selectedRole = (roles || availableRoles).find(r => r.id === e.target.value);
                          roleField.onChange(e.target.value);
                          if (selectedRole) {
                            setValue(`rolePermissions.${index}.roleName`, selectedRole.name);
                          }
                        }}
                        className={cn(
                          "w-full px-3 py-2 border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      >
                        <option value="">Select Role</option>
                        {(roles || availableRoles).map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => rolePermissionsArray.remove(index)}
                    className="ml-3 p-1 text-red-400 hover:text-red-600 transition-colors"
                    title="Remove Role Permission"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map(method => (
                  <div key={method} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {method}
                    </label>
                    <Controller
                      name={`rolePermissions.${index}.permissions.${method}`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={readOnly}
                          className={cn(
                            "w-full px-2 py-1 text-xs border border-gray-300 rounded",
                            "focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500",
                            "disabled:bg-gray-50 disabled:text-gray-500"
                          )}
                        >
                          <option value="none">None</option>
                          <option value="read">Read</option>
                          <option value="write">Write</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {rolePermissionsArray.fields.length === 0 && (
            <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No role permissions configured</p>
              <p className="text-xs text-gray-400">Add role permissions to control access to endpoints</p>
            </div>
          )}
        </div>
        
        {/* Inheritance Setting */}
        <div className="pt-4 border-t border-gray-200">
          <Controller
            name="inheritFromParent"
            control={control}
            render={({ field: { value, onChange } }) => (
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={readOnly}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Inherit permissions from parent service
                  </span>
                  <p className="text-xs text-gray-500">
                    When enabled, this endpoint will inherit all permissions from the parent service
                  </p>
                </div>
              </label>
            )}
          />
        </div>
      </div>
    </div>
  );
  
  /**
   * Security Rules Section
   */
  const SecurityRulesSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-medium text-gray-900">Security Rules</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Define custom security rules that will be evaluated by Next.js middleware
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddSecurityRule}
              className={cn(
                "inline-flex items-center px-3 py-1.5 border border-transparent",
                "text-xs font-medium rounded text-purple-700 bg-purple-100",
                "hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500",
                "transition-colors duration-200"
              )}
            >
              <PlusIcon className="w-3 h-3 mr-1" />
              Add Security Rule
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {securityRulesArray.fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name={`securityRules.${index}.name`}
                    control={control}
                    render={({ field: nameField }) => (
                      <input
                        {...nameField}
                        placeholder="Rule Name"
                        disabled={readOnly}
                        className={cn(
                          "px-3 py-2 text-sm border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      />
                    )}
                  />
                  
                  <Controller
                    name={`securityRules.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={readOnly}
                        className={cn(
                          "px-3 py-2 text-sm border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      >
                        <option value="endpoint">Endpoint</option>
                        <option value="resource">Resource</option>
                        <option value="field">Field</option>
                        <option value="custom">Custom</option>
                      </select>
                    )}
                  />
                  
                  <Controller
                    name={`securityRules.${index}.action`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={readOnly}
                        className={cn(
                          "px-3 py-2 text-sm border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      >
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                        <option value="require_auth">Require Auth</option>
                        <option value="custom">Custom</option>
                      </select>
                    )}
                  />
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Controller
                    name={`securityRules.${index}.enabled`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          disabled={readOnly}
                          className="w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-700">Enabled</span>
                      </label>
                    )}
                  />
                  
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => securityRulesArray.remove(index)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete Security Rule"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <Controller
                    name={`securityRules.${index}.condition`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="request.method === 'GET' && request.user.role === 'admin'"
                        disabled={readOnly}
                        rows={2}
                        className={cn(
                          "w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                          "disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                        )}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Controller
                    name={`securityRules.${index}.priority`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="1"
                        max="100"
                        disabled={readOnly}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className={cn(
                          "w-full px-3 py-2 text-sm border border-gray-300 rounded",
                          "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      />
                    )}
                  />
                </div>
              </div>
              
              <Controller
                name={`securityRules.${index}.description`}
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Description of what this security rule does"
                    disabled={readOnly}
                    rows={2}
                    className={cn(
                      "w-full px-3 py-2 text-sm border border-gray-300 rounded",
                      "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                      "disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    )}
                  />
                )}
              />
            </div>
          ))}
          
          {securityRulesArray.fields.length === 0 && (
            <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No security rules configured</p>
              <p className="text-xs text-gray-400">Add custom security rules for fine-grained access control</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Rate Limiting */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Rate Limiting</h4>
          <Controller
            name="enableRateLimiting"
            control={control}
            render={({ field: { value, onChange } }) => (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={readOnly}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Rate Limiting</span>
              </label>
            )}
          />
        </div>
        
        {watchedValues.enableRateLimiting && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requests per minute
              </label>
              <Controller
                name="rateLimitRpm"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1"
                    max="10000"
                    disabled={readOnly}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className={cn(
                      "w-full md:w-48 px-3 py-2 border border-gray-300 rounded",
                      "focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500",
                      "disabled:bg-gray-50 disabled:text-gray-500",
                      errors.rateLimitRpm && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                )}
              />
              {errors.rateLimitRpm && (
                <p className="mt-1 text-sm text-red-600">{errors.rateLimitRpm.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  /**
   * Session Management Section
   */
  const SessionManagementSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClockIcon className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
      </div>
      
      <div className="space-y-6">
        {/* Session Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Expiration (minutes)
            </label>
            <Controller
              name="sessionConfig.expirationMinutes"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="5"
                  max="10080"
                  disabled={readOnly}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded",
                    "focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500",
                    "disabled:bg-gray-50 disabled:text-gray-500"
                  )}
                />
              )}
            />
            <p className="mt-1 text-xs text-gray-500">5 minutes to 1 week (10,080 minutes)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Concurrent Sessions
            </label>
            <Controller
              name="sessionConfig.maxConcurrentSessions"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="1"
                  max="100"
                  disabled={readOnly}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded",
                    "focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500",
                    "disabled:bg-gray-50 disabled:text-gray-500"
                  )}
                />
              )}
            />
          </div>
        </div>
        
        {/* Session Options */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="sessionConfig.refreshEnabled"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Token Refresh</span>
                    <p className="text-xs text-gray-500">Automatically refresh tokens before expiration</p>
                  </div>
                </label>
              )}
            />
            
            <Controller
              name="sessionConfig.requireReauth"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Require Re-authentication</span>
                    <p className="text-xs text-gray-500">Force re-auth for sensitive operations</p>
                  </div>
                </label>
              )}
            />
            
            <Controller
              name="sessionConfig.ipValidation"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">IP Address Validation</span>
                    <p className="text-xs text-gray-500">Validate session IP address on each request</p>
                  </div>
                </label>
              )}
            />
            
            <Controller
              name="sessionConfig.userAgentValidation"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">User Agent Validation</span>
                    <p className="text-xs text-gray-500">Validate browser signature consistency</p>
                  </div>
                </label>
              )}
            />
          </div>
          
          {watchedValues.sessionConfig.refreshEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Threshold (minutes before expiration)
              </label>
              <Controller
                name="sessionConfig.refreshThresholdMinutes"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1"
                    max="60"
                    disabled={readOnly}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className={cn(
                      "w-full md:w-48 px-3 py-2 border border-gray-300 rounded",
                      "focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500",
                      "disabled:bg-gray-50 disabled:text-gray-500"
                    )}
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  /**
   * Advanced Settings Section
   */
  const AdvancedSettingsSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CogIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
      </div>
      
      <div className="space-y-6">
        {/* Audit Logging */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Audit Logging</h4>
            <Controller
              name="enableAuditLogging"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Audit Logging</span>
                </label>
              )}
            />
          </div>
          
          {watchedValues.enableAuditLogging && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to Log
              </label>
              <Controller
                name="auditEvents"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['auth', 'access', 'error', 'create', 'update', 'delete', 'admin', 'security'].map(event => (
                      <label key={event} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChange([...value, event]);
                            } else {
                              onChange(value.filter((v: string) => v !== event));
                            }
                          }}
                          disabled={readOnly}
                          className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{event}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          )}
        </div>
        
        {/* CORS Configuration */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">CORS Configuration</h4>
            <Controller
              name="enableCors"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable CORS</span>
                </label>
              )}
            />
          </div>
          
          {watchedValues.enableCors && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Origins
              </label>
              <Controller
                name="corsOrigins"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <textarea
                    value={value.join('\n')}
                    onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
                    placeholder="https://example.com&#10;https://app.example.com&#10;*"
                    disabled={readOnly}
                    rows={4}
                    className={cn(
                      "w-full px-3 py-2 text-sm border border-gray-300 rounded",
                      "focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500",
                      "disabled:bg-gray-50 disabled:text-gray-500 resize-none",
                      errors.corsOrigins && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter one origin per line. Use * to allow all origins (not recommended for production)
              </p>
              {errors.corsOrigins && (
                <p className="mt-1 text-sm text-red-600">{errors.corsOrigins.message}</p>
              )}
            </div>
          )}
        </div>
        
        {/* SSL Configuration */}
        <div className="pt-6 border-t border-gray-200">
          <Controller
            name="enableSsl"
            control={control}
            render={({ field: { value, onChange } }) => (
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={readOnly}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Require SSL/TLS</span>
                  <p className="text-xs text-gray-500">Force HTTPS connections for this endpoint</p>
                </div>
              </label>
            )}
          />
        </div>
      </div>
    </div>
  );
  
  /**
   * Security Testing Section
   */
  const SecurityTestingSection: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-medium text-gray-900">Security Testing</h3>
        </div>
        
        {onTest && !readOnly && (
          <button
            type="button"
            onClick={handleSecurityTest}
            disabled={testingInProgress || !isValid}
            className={cn(
              "inline-flex items-center px-4 py-2 border border-transparent",
              "text-sm font-medium rounded-md text-white bg-orange-600",
              "hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            )}
          >
            {testingInProgress ? (
              <>
                <RefreshIcon className="w-4 h-4 mr-2 animate-spin" />
                Testing Security...
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                Run Security Test
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  result.passed
                    ? "border-green-400 bg-green-50"
                    : "border-red-400 bg-red-50"
                )}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {result.passed ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <XMarkIcon className="w-4 h-4 text-red-600" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    result.passed ? "text-green-800" : "text-red-800"
                  )}>
                    {result.testType.charAt(0).toUpperCase() + result.testType.slice(1)} Test
                  </span>
                  <span className="text-xs text-gray-500">
                    ({result.duration}ms)
                  </span>
                </div>
                <p className={cn(
                  "text-sm",
                  result.passed ? "text-green-700" : "text-red-700"
                )}>
                  {result.message}
                </p>
                {result.details && (
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Test Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Security Testing Information
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Tests validate authentication and authorization rules</li>
              <li>• Rate limiting and CORS configurations are verified</li>
              <li>• Security rule conditions are syntax-checked</li>
              <li>• Performance requirements are measured (under 100ms rule evaluation)</li>
              <li>• Audit logging functionality is tested</li>
            </ul>
            {currentConfig?.lastTested && (
              <p className="text-xs text-blue-600 mt-2">
                Last tested: {new Date(currentConfig.lastTested).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // =============================================================================
  // NAVIGATION AND SECTIONS
  // =============================================================================
  
  const sections = [
    { id: 'authentication', label: 'Authentication', icon: LockClosedIcon },
    { id: 'authorization', label: 'Authorization', icon: UserGroupIcon },
    { id: 'security-rules', label: 'Security Rules', icon: ShieldCheckIcon },
    { id: 'session-management', label: 'Session Management', icon: ClockIcon },
    { id: 'advanced-settings', label: 'Advanced Settings', icon: CogIcon },
    { id: 'testing', label: 'Security Testing', icon: ExclamationTriangleIcon }
  ];
  
  const renderSection = () => {
    switch (activeSection) {
      case 'authentication':
        return <AuthenticationSection />;
      case 'authorization':
        return <AuthorizationSection />;
      case 'security-rules':
        return <SecurityRulesSection />;
      case 'session-management':
        return <SessionManagementSection />;
      case 'advanced-settings':
        return <AdvancedSettingsSection />;
      case 'testing':
        return <SecurityTestingSection />;
      default:
        return <AuthenticationSection />;
    }
  };
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure authentication, authorization, and security settings for {serviceName}
            </p>
          </div>
          
          {!readOnly && (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || !isValid || loading}
                className={cn(
                  "inline-flex items-center px-4 py-2 border border-transparent",
                  "text-sm font-medium rounded-md text-white bg-blue-600",
                  "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                )}
              >
                {loading ? (
                  <>
                    <RefreshIcon className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <XMarkIcon className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex">
        {/* Navigation Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <nav className="p-4 space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    activeSection === section.id
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {renderSection()}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecurityConfiguration;

/**
 * Export Types for External Use
 */
export type {
  SecurityConfigurationProps,
  SecurityConfiguration as SecurityConfigurationType,
  ApiKeyConfig,
  RolePermission,
  SecurityRule,
  SessionConfig,
  SecurityTestResult,
  AuthMethod,
  PermissionLevel,
  HttpMethod,
  SecurityRuleType
};