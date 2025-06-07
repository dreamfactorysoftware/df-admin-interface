/**
 * Security Validation Hook for DreamFactory Admin Interface
 * 
 * Comprehensive React hook implementing security rule validation with Zod schema integration,
 * real-time validation under 100ms, and role-based access control enforcement.
 * 
 * Features:
 * - Zod schema validators integrated with React Hook Form
 * - Real-time validation with debouncing for performance optimization
 * - Dynamic validation rules for security configurations
 * - Permission validation with component-level access control
 * - Rate limiting and access policy validation
 * - Type-safe security workflows with comprehensive error handling
 * 
 * Performance Requirements:
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Debounced input validation to prevent excessive API calls
 * - Optimized validation logic for large security rule sets
 * 
 * @fileoverview Security validation hook with RBAC and performance optimization
 * @version 1.0.0
 * @since React Migration 1.0.0
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import { 
  type UseFormReturn, 
  type FieldValues, 
  type Path,
  type PathValue,
  type FieldError,
  type FieldErrors
} from 'react-hook-form';

// =============================================================================
// CORE VALIDATION TYPES AND INTERFACES
// =============================================================================

/**
 * Security validation context for rule evaluation
 * Provides comprehensive context for dynamic security rule validation
 */
export interface SecurityValidationContext {
  /** Current user session information */
  user?: {
    id: number;
    roleId: number;
    isSysAdmin: boolean;
    isRootAdmin: boolean;
    permissions: string[];
  };
  /** Service context for service-specific validation */
  service?: {
    id: number;
    type: string;
    name: string;
  };
  /** Request context for endpoint validation */
  request?: {
    method: string;
    endpoint: string;
    userAgent?: string;
    ipAddress?: string;
  };
  /** Environment context */
  environment?: 'development' | 'staging' | 'production';
  /** Additional validation metadata */
  metadata?: Record<string, any>;
}

/**
 * Security validation result with detailed error information
 * Supports both synchronous and asynchronous validation scenarios
 */
export interface SecurityValidationResult {
  /** Validation success flag */
  isValid: boolean;
  /** Detailed error messages keyed by field path */
  errors: Record<string, string>;
  /** Validation warnings (non-blocking) */
  warnings: Record<string, string>;
  /** Validation performance metrics */
  metrics: {
    /** Validation execution time in milliseconds */
    executionTime: number;
    /** Number of rules evaluated */
    rulesEvaluated: number;
    /** Timestamp of validation */
    timestamp: Date;
  };
  /** Additional context from validation */
  context?: Record<string, any>;
}

/**
 * Dynamic security rule definition for runtime validation
 * Supports complex business logic validation scenarios
 */
export interface SecurityRule<TData = any> {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Rule description for documentation */
  description?: string;
  /** Rule category for organization */
  category: SecurityRuleCategory;
  /** Rule priority (higher numbers execute first) */
  priority: number;
  /** Rule conditions for when it applies */
  conditions?: SecurityRuleCondition[];
  /** Validation function */
  validate: (data: TData, context: SecurityValidationContext) => SecurityRuleResult | Promise<SecurityRuleResult>;
  /** Rule enabled flag */
  enabled: boolean;
  /** Rule metadata */
  metadata?: Record<string, any>;
}

/**
 * Security rule categories for organization and filtering
 */
export type SecurityRuleCategory = 
  | 'authentication'
  | 'authorization' 
  | 'access_control'
  | 'rate_limiting'
  | 'data_validation'
  | 'policy_enforcement'
  | 'compliance'
  | 'audit';

/**
 * Security rule condition for conditional execution
 */
export interface SecurityRuleCondition {
  /** Field path to evaluate */
  field: string;
  /** Condition operator */
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  /** Expected value(s) */
  value: any;
  /** Logical operator for multiple conditions */
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Individual security rule validation result
 */
export interface SecurityRuleResult {
  /** Rule execution success */
  success: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Warning message if applicable */
  warning?: string;
  /** Additional result data */
  data?: any;
}

/**
 * Permission validation configuration
 * Supports role-based and resource-specific permission checking
 */
export interface PermissionValidationConfig {
  /** Required permissions for validation */
  requiredPermissions: string[];
  /** Resource context for permission checking */
  resource?: string;
  /** Operation context */
  operation?: 'create' | 'read' | 'update' | 'delete' | 'execute';
  /** Service context for service-specific permissions */
  serviceId?: number;
  /** Component context for granular permissions */
  component?: string;
  /** Allow admin override */
  allowAdminOverride?: boolean;
}

/**
 * Validation performance configuration
 * Ensures validation meets 100ms performance requirement
 */
export interface ValidationPerformanceConfig {
  /** Maximum validation time in milliseconds (default: 100ms) */
  maxExecutionTime: number;
  /** Debounce delay for real-time validation in milliseconds (default: 300ms) */
  debounceDelay: number;
  /** Enable validation caching */
  enableCaching: boolean;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration: number;
  /** Maximum concurrent validations */
  maxConcurrentValidations: number;
}

// =============================================================================
// ZOD SECURITY VALIDATION SCHEMAS
// =============================================================================

/**
 * Role-based access control validation schema
 * Validates role assignments and permission configurations
 */
export const RoleValidationSchema = z.object({
  roleId: z
    .number()
    .int()
    .positive('Role ID must be a positive integer'),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required')
    .refine(
      (permissions) => permissions.every(p => p.trim().length > 0),
      'All permissions must be non-empty strings'
    ),
  serviceAccess: z
    .array(z.object({
      serviceId: z.number().int().positive(),
      component: z.string().min(1),
      verbMask: z.number().int().min(0).max(31),
      filters: z.array(z.string()).optional(),
    }))
    .optional(),
  expiresAt: z
    .date()
    .min(new Date(), 'Role assignment cannot expire in the past')
    .optional(),
}).refine(
  (data) => {
    // Business logic: Validate permission combinations
    if (data.permissions.includes('admin') && data.permissions.length > 1) {
      return false;
    }
    return true;
  },
  {
    message: 'Admin permission cannot be combined with other permissions',
    path: ['permissions'],
  }
);

/**
 * Rate limiting configuration validation schema
 * Validates rate limiting rules and policies
 */
export const RateLimitValidationSchema = z.object({
  type: z.enum(['user', 'role', 'service', 'endpoint', 'global'], {
    errorMap: () => ({ message: 'Invalid rate limit type' }),
  }),
  rate: z
    .number()
    .int()
    .min(1, 'Rate must be at least 1')
    .max(10000, 'Rate cannot exceed 10,000 requests'),
  period: z.enum(['minute', 'hour', 'day', '7-day', '30-day'], {
    errorMap: () => ({ message: 'Invalid time period' }),
  }),
  burst: z
    .number()
    .int()
    .min(1)
    .optional(),
  userId: z
    .number()
    .int()
    .positive()
    .optional(),
  roleId: z
    .number()
    .int()
    .positive()
    .optional(),
  serviceId: z
    .number()
    .int()
    .positive()
    .optional(),
  endpoint: z
    .string()
    .regex(/^\/[a-zA-Z0-9\/_-]*$/, 'Invalid endpoint format')
    .optional(),
}).refine(
  (data) => {
    // Business logic: Validate type-specific requirements
    switch (data.type) {
      case 'user':
        return data.userId !== undefined;
      case 'role':
        return data.roleId !== undefined;
      case 'service':
        return data.serviceId !== undefined;
      case 'endpoint':
        return data.endpoint !== undefined;
      case 'global':
        return true;
      default:
        return false;
    }
  },
  {
    message: 'Required fields missing for selected rate limit type',
    path: ['type'],
  }
);

/**
 * API security configuration validation schema
 * Validates API key configurations and security policies
 */
export const ApiSecurityValidationSchema = z.object({
  apiKey: z
    .string()
    .min(32, 'API key must be at least 32 characters')
    .max(512, 'API key cannot exceed 512 characters')
    .regex(/^[A-Za-z0-9+/=_-]+$/, 'API key contains invalid characters'),
  allowedHosts: z
    .array(z.string().regex(/^[a-zA-Z0-9.-]+$/, 'Invalid hostname format'))
    .min(1, 'At least one allowed host is required')
    .max(100, 'Cannot exceed 100 allowed hosts'),
  allowedMethods: z
    .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']))
    .min(1, 'At least one HTTP method must be allowed'),
  corsEnabled: z.boolean(),
  corsOrigins: z
    .array(z.string().url('Invalid CORS origin URL'))
    .optional(),
  rateLimitOverride: RateLimitValidationSchema.optional(),
  expiresAt: z
    .date()
    .min(new Date(), 'API key cannot expire in the past')
    .optional(),
});

/**
 * Access policy validation schema
 * Validates complex access control policies
 */
export const AccessPolicyValidationSchema = z.object({
  name: z
    .string()
    .min(1, 'Policy name is required')
    .max(100, 'Policy name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Policy name contains invalid characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  rules: z
    .array(z.object({
      resource: z.string().min(1),
      action: z.enum(['allow', 'deny']),
      conditions: z.array(z.object({
        field: z.string().min(1),
        operator: z.enum(['equals', 'not_equals', 'in', 'not_in', 'contains']),
        value: z.any(),
      })).optional(),
    }))
    .min(1, 'At least one access rule is required'),
  priority: z
    .number()
    .int()
    .min(0)
    .max(1000),
  enabled: z.boolean(),
  effectiveDate: z.date().optional(),
  expirationDate: z.date().optional(),
}).refine(
  (data) => {
    // Business logic: Validate date constraints
    if (data.effectiveDate && data.expirationDate) {
      return data.effectiveDate < data.expirationDate;
    }
    return true;
  },
  {
    message: 'Effective date must be before expiration date',
    path: ['expirationDate'],
  }
);

// =============================================================================
// CORE SECURITY VALIDATION HOOK
// =============================================================================

/**
 * Configuration interface for useSecurityValidation hook
 */
export interface UseSecurityValidationConfig<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form instance */
  form?: UseFormReturn<TFieldValues>;
  /** Validation context */
  context?: SecurityValidationContext;
  /** Performance configuration */
  performance?: Partial<ValidationPerformanceConfig>;
  /** Custom security rules */
  customRules?: SecurityRule<TFieldValues>[];
  /** Enable permission validation */
  enablePermissionValidation?: boolean;
  /** Permission configuration */
  permissionConfig?: PermissionValidationConfig;
  /** Enable real-time validation */
  enableRealTimeValidation?: boolean;
  /** Validation schemas */
  schemas?: {
    role?: z.ZodSchema<any>;
    rateLimit?: z.ZodSchema<any>;
    apiSecurity?: z.ZodSchema<any>;
    accessPolicy?: z.ZodSchema<any>;
    custom?: z.ZodSchema<any>;
  };
}

/**
 * Return type for useSecurityValidation hook
 */
export interface UseSecurityValidationReturn<TFieldValues extends FieldValues = FieldValues> {
  /** Validate specific field */
  validateField: (fieldName: Path<TFieldValues>, value?: PathValue<TFieldValues, Path<TFieldValues>>) => Promise<string | undefined>;
  
  /** Validate entire form */
  validateForm: (data: TFieldValues) => Promise<SecurityValidationResult>;
  
  /** Validate permissions for current context */
  validatePermissions: (config?: PermissionValidationConfig) => Promise<boolean>;
  
  /** Validate role assignment */
  validateRole: (roleData: any) => Promise<SecurityValidationResult>;
  
  /** Validate rate limit configuration */
  validateRateLimit: (limitData: any) => Promise<SecurityValidationResult>;
  
  /** Validate API security configuration */
  validateApiSecurity: (securityData: any) => Promise<SecurityValidationResult>;
  
  /** Validate access policy */
  validateAccessPolicy: (policyData: any) => Promise<SecurityValidationResult>;
  
  /** Execute custom security rules */
  executeSecurityRules: (data: TFieldValues, rules?: SecurityRule<TFieldValues>[]) => Promise<SecurityValidationResult>;
  
  /** Check if user has specific permission */
  hasPermission: (permission: string, resource?: string) => boolean;
  
  /** Get validation errors for React Hook Form */
  getFormErrors: () => FieldErrors<TFieldValues>;
  
  /** Clear validation errors */
  clearErrors: (fieldName?: Path<TFieldValues>) => void;
  
  /** Validation state */
  isValidating: boolean;
  
  /** Validation metrics */
  validationMetrics: {
    totalValidations: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    lastValidationTime?: Date;
  };
  
  /** Current validation errors */
  validationErrors: Record<string, string>;
  
  /** Current validation warnings */
  validationWarnings: Record<string, string>;
}

/**
 * Custom React hook for comprehensive security validation
 * 
 * Provides real-time validation under 100ms with Zod integration,
 * role-based access control, and comprehensive security rule validation.
 * 
 * @param config - Hook configuration options
 * @returns Security validation interface
 * 
 * @example
 * ```tsx
 * // Basic usage with React Hook Form
 * const form = useForm<SecurityFormData>();
 * const security = useSecurityValidation({
 *   form,
 *   context: { user: currentUser },
 *   enableRealTimeValidation: true,
 * });
 * 
 * // Field validation
 * const validateRoleName = async (value: string) => {
 *   const error = await security.validateField('roleName', value);
 *   return error || true;
 * };
 * 
 * // Permission checking
 * const canManageRoles = security.hasPermission('role:manage');
 * 
 * // Form submission validation
 * const handleSubmit = async (data: SecurityFormData) => {
 *   const result = await security.validateForm(data);
 *   if (result.isValid) {
 *     // Submit form
 *   } else {
 *     // Handle validation errors
 *   }
 * };
 * ```
 */
export function useSecurityValidation<TFieldValues extends FieldValues = FieldValues>(
  config: UseSecurityValidationConfig<TFieldValues> = {}
): UseSecurityValidationReturn<TFieldValues> {
  
  // =============================================================================
  // STATE AND REFS
  // =============================================================================
  
  const {
    form,
    context = {},
    performance = {},
    customRules = [],
    enablePermissionValidation = true,
    permissionConfig,
    enableRealTimeValidation = true,
    schemas = {},
  } = config;

  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string>>({});
  const [validationMetrics, setValidationMetrics] = useState({
    totalValidations: 0,
    averageExecutionTime: 0,
    cacheHitRate: 0,
    lastValidationTime: undefined as Date | undefined,
  });

  // Performance configuration with defaults
  const performanceConfig: ValidationPerformanceConfig = {
    maxExecutionTime: 100,
    debounceDelay: 300,
    enableCaching: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    maxConcurrentValidations: 3,
    ...performance,
  };

  // Validation cache and debounce refs
  const validationCacheRef = useRef(new Map<string, { result: any; timestamp: number }>());
  const debounceTimeoutsRef = useRef(new Map<string, NodeJS.Timeout>());
  const activeValidationsRef = useRef(new Set<string>());

  // =============================================================================
  // DEFAULT SECURITY RULES
  // =============================================================================

  const defaultSecurityRules = useMemo<SecurityRule<TFieldValues>[]>(() => [
    {
      id: 'role_permission_consistency',
      name: 'Role Permission Consistency',
      description: 'Validates that role permissions are consistent and non-conflicting',
      category: 'authorization',
      priority: 100,
      enabled: true,
      validate: async (data: any, ctx) => {
        if (data.permissions && Array.isArray(data.permissions)) {
          // Check for conflicting permissions
          const hasAdmin = data.permissions.includes('admin');
          const hasOtherPerms = data.permissions.length > 1;
          
          if (hasAdmin && hasOtherPerms) {
            return {
              success: false,
              error: 'Admin permission cannot be combined with other permissions',
            };
          }
        }
        return { success: true };
      },
    },
    {
      id: 'rate_limit_reasonableness',
      name: 'Rate Limit Reasonableness',
      description: 'Validates that rate limits are within reasonable bounds',
      category: 'rate_limiting',
      priority: 90,
      enabled: true,
      validate: async (data: any, ctx) => {
        if (data.rate && data.period) {
          const ratePerMinute = data.period === 'minute' ? data.rate :
                               data.period === 'hour' ? data.rate / 60 :
                               data.period === 'day' ? data.rate / (60 * 24) : data.rate;
          
          if (ratePerMinute > 1000) {
            return {
              success: false,
              error: 'Rate limit exceeds maximum reasonable threshold of 1000 requests per minute',
            };
          }
          
          if (ratePerMinute < 0.01) {
            return {
              success: false,
              warning: 'Rate limit is very restrictive and may impact user experience',
            };
          }
        }
        return { success: true };
      },
    },
    {
      id: 'api_key_security',
      name: 'API Key Security',
      description: 'Validates API key strength and security requirements',
      category: 'authentication',
      priority: 95,
      enabled: true,
      validate: async (data: any, ctx) => {
        if (data.apiKey) {
          // Check entropy and patterns
          const entropy = calculateEntropy(data.apiKey);
          if (entropy < 4.5) {
            return {
              success: false,
              error: 'API key has insufficient entropy for security requirements',
            };
          }
          
          // Check for common patterns
          if (/(.)\1{3,}/.test(data.apiKey)) {
            return {
              success: false,
              error: 'API key contains repeating character patterns',
            };
          }
        }
        return { success: true };
      },
    },
  ], []);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Calculate entropy of a string for security validation
   */
  const calculateEntropy = useCallback((str: string): number => {
    const chars = Array.from(new Set(str));
    const length = str.length;
    
    if (length === 0) return 0;
    
    return chars.reduce((entropy, char) => {
      const frequency = str.split(char).length - 1;
      const probability = frequency / length;
      return entropy - probability * Math.log2(probability);
    }, 0);
  }, []);

  /**
   * Get cache key for validation results
   */
  const getCacheKey = useCallback((type: string, data: any): string => {
    return `${type}:${JSON.stringify(data)}`;
  }, []);

  /**
   * Check if cached result is still valid
   */
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < performanceConfig.cacheDuration;
  }, [performanceConfig.cacheDuration]);

  /**
   * Execute validation with performance monitoring
   */
  const executeWithPerformanceTracking = useCallback(async <T>(
    operation: () => Promise<T>,
    operationType: string
  ): Promise<T> => {
    const startTime = Date.now();
    const validationId = `${operationType}:${startTime}`;
    
    try {
      activeValidationsRef.current.add(validationId);
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Validation timeout')), performanceConfig.maxExecutionTime)
        ),
      ]);
      
      const executionTime = Date.now() - startTime;
      
      // Update metrics
      setValidationMetrics(prev => ({
        totalValidations: prev.totalValidations + 1,
        averageExecutionTime: (prev.averageExecutionTime * prev.totalValidations + executionTime) / (prev.totalValidations + 1),
        cacheHitRate: prev.cacheHitRate, // Updated separately
        lastValidationTime: new Date(),
      }));
      
      return result;
    } finally {
      activeValidationsRef.current.delete(validationId);
    }
  }, [performanceConfig.maxExecutionTime]);

  // =============================================================================
  // PERMISSION VALIDATION
  // =============================================================================

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string, resource?: string): boolean => {
    if (!enablePermissionValidation || !context.user) {
      return true; // Allow if permission validation is disabled or no user context
    }

    const { user } = context;
    
    // Root admin has all permissions
    if (user.isRootAdmin) {
      return true;
    }
    
    // System admin has most permissions
    if (user.isSysAdmin && !permission.includes('root')) {
      return true;
    }
    
    // Check explicit permissions
    const userPermissions = user.permissions || [];
    const resourcePermission = resource ? `${resource}:${permission}` : permission;
    
    return userPermissions.includes(permission) || 
           userPermissions.includes(resourcePermission) ||
           userPermissions.includes('*');
  }, [enablePermissionValidation, context.user]);

  /**
   * Validate permissions for current context
   */
  const validatePermissions = useCallback(async (config?: PermissionValidationConfig): Promise<boolean> => {
    const permConfig = config || permissionConfig;
    
    if (!permConfig || !enablePermissionValidation) {
      return true;
    }

    const { requiredPermissions, resource, operation, allowAdminOverride = true } = permConfig;
    
    // Admin override check
    if (allowAdminOverride && context.user?.isRootAdmin) {
      return true;
    }
    
    // Check all required permissions
    return requiredPermissions.every(permission => {
      const fullPermission = operation ? `${permission}:${operation}` : permission;
      return hasPermission(fullPermission, resource);
    });
  }, [permissionConfig, enablePermissionValidation, context.user, hasPermission]);

  // =============================================================================
  // FIELD VALIDATION
  // =============================================================================

  /**
   * Validate specific field with debouncing
   */
  const validateField = useCallback(async (
    fieldName: Path<TFieldValues>,
    value?: PathValue<TFieldValues, Path<TFieldValues>>
  ): Promise<string | undefined> => {
    const fieldKey = `field:${fieldName}:${JSON.stringify(value)}`;
    
    // Check cache first
    if (performanceConfig.enableCaching) {
      const cached = validationCacheRef.current.get(fieldKey);
      if (cached && isCacheValid(cached.timestamp)) {
        setValidationMetrics(prev => ({
          ...prev,
          cacheHitRate: (prev.cacheHitRate * prev.totalValidations + 1) / (prev.totalValidations + 1),
        }));
        return cached.result;
      }
    }
    
    // Debounce validation if real-time is enabled
    if (enableRealTimeValidation) {
      const existingTimeout = debounceTimeoutsRef.current.get(fieldKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      return new Promise((resolve) => {
        const timeout = setTimeout(async () => {
          const result = await executeFieldValidation(fieldName, value);
          
          // Cache result
          if (performanceConfig.enableCaching) {
            validationCacheRef.current.set(fieldKey, {
              result,
              timestamp: Date.now(),
            });
          }
          
          resolve(result);
        }, performanceConfig.debounceDelay);
        
        debounceTimeoutsRef.current.set(fieldKey, timeout);
      });
    }
    
    return executeFieldValidation(fieldName, value);
  }, [enableRealTimeValidation, performanceConfig]);

  /**
   * Execute field validation logic
   */
  const executeFieldValidation = useCallback(async (
    fieldName: Path<TFieldValues>,
    value?: PathValue<TFieldValues, Path<TFieldValues>>
  ): Promise<string | undefined> => {
    return executeWithPerformanceTracking(async () => {
      // Use form value if not provided
      const fieldValue = value !== undefined ? value : form?.getValues(fieldName);
      
      // Check permission for field access
      if (enablePermissionValidation && !hasPermission(`field:${fieldName}`, 'edit')) {
        return 'Insufficient permissions to modify this field';
      }
      
      // Execute field-specific validation based on field name
      try {
        if (fieldName.includes('role') && schemas.role) {
          const result = await schemas.role.parseAsync({ [fieldName]: fieldValue });
          return undefined; // No error
        }
        
        if (fieldName.includes('rate') && schemas.rateLimit) {
          const result = await schemas.rateLimit.parseAsync({ [fieldName]: fieldValue });
          return undefined;
        }
        
        if (fieldName.includes('api') && schemas.apiSecurity) {
          const result = await schemas.apiSecurity.parseAsync({ [fieldName]: fieldValue });
          return undefined;
        }
        
        return undefined; // No validation error
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message || 'Validation failed';
        }
        return 'Validation error occurred';
      }
    }, 'field-validation');
  }, [form, enablePermissionValidation, hasPermission, schemas, executeWithPerformanceTracking]);

  // =============================================================================
  // FORM VALIDATION
  // =============================================================================

  /**
   * Validate entire form with comprehensive security rules
   */
  const validateForm = useCallback(async (data: TFieldValues): Promise<SecurityValidationResult> => {
    return executeWithPerformanceTracking(async () => {
      setIsValidating(true);
      const startTime = Date.now();
      
      try {
        const errors: Record<string, string> = {};
        const warnings: Record<string, string> = {};
        let rulesEvaluated = 0;
        
        // Permission validation
        if (enablePermissionValidation) {
          const hasPermission = await validatePermissions();
          if (!hasPermission) {
            errors.general = 'Insufficient permissions for this operation';
          }
        }
        
        // Execute security rules
        const allRules = [...defaultSecurityRules, ...customRules];
        const enabledRules = allRules
          .filter(rule => rule.enabled)
          .sort((a, b) => b.priority - a.priority);
        
        for (const rule of enabledRules) {
          try {
            // Check rule conditions
            if (rule.conditions && !evaluateRuleConditions(rule.conditions, data)) {
              continue;
            }
            
            const result = await rule.validate(data, context);
            rulesEvaluated++;
            
            if (!result.success) {
              if (result.error) {
                errors[rule.id] = result.error;
              }
              if (result.warning) {
                warnings[rule.id] = result.warning;
              }
            }
          } catch (error) {
            errors[rule.id] = `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
        
        const executionTime = Date.now() - startTime;
        const isValid = Object.keys(errors).length === 0;
        
        // Update component state
        setValidationErrors(errors);
        setValidationWarnings(warnings);
        
        return {
          isValid,
          errors,
          warnings,
          metrics: {
            executionTime,
            rulesEvaluated,
            timestamp: new Date(),
          },
          context: {
            user: context.user,
            environment: context.environment,
          },
        };
      } finally {
        setIsValidating(false);
      }
    }, 'form-validation');
  }, [
    context,
    customRules,
    defaultSecurityRules,
    enablePermissionValidation,
    validatePermissions,
    executeWithPerformanceTracking,
  ]);

  /**
   * Evaluate rule conditions
   */
  const evaluateRuleConditions = useCallback((
    conditions: SecurityRuleCondition[],
    data: TFieldValues
  ): boolean => {
    if (conditions.length === 0) return true;
    
    const results = conditions.map(condition => {
      const fieldValue = getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'not_in':
          return !Array.isArray(condition.value) || !condition.value.includes(fieldValue);
        case 'greater_than':
          return typeof fieldValue === 'number' && fieldValue > condition.value;
        case 'less_than':
          return typeof fieldValue === 'number' && fieldValue < condition.value;
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
        case 'regex':
          return typeof fieldValue === 'string' && new RegExp(condition.value).test(fieldValue);
        default:
          return false;
      }
    });
    
    // Handle logical operators
    const hasOr = conditions.some(c => c.logicalOperator === 'OR');
    if (hasOr) {
      return results.some(Boolean);
    }
    return results.every(Boolean);
  }, []);

  /**
   * Get nested value from object
   */
  const getNestedValue = useCallback((obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // =============================================================================
  // SPECIFIC VALIDATION FUNCTIONS
  // =============================================================================

  /**
   * Validate role configuration
   */
  const validateRole = useCallback(async (roleData: any): Promise<SecurityValidationResult> => {
    return executeWithPerformanceTracking(async () => {
      try {
        const schema = schemas.role || RoleValidationSchema;
        await schema.parseAsync(roleData);
        
        return {
          isValid: true,
          errors: {},
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        const errors: Record<string, string> = {};
        
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors[err.path.join('.')] = err.message;
          });
        } else {
          errors.general = 'Role validation failed';
        }
        
        return {
          isValid: false,
          errors,
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      }
    }, 'role-validation');
  }, [schemas.role, executeWithPerformanceTracking]);

  /**
   * Validate rate limit configuration
   */
  const validateRateLimit = useCallback(async (limitData: any): Promise<SecurityValidationResult> => {
    return executeWithPerformanceTracking(async () => {
      try {
        const schema = schemas.rateLimit || RateLimitValidationSchema;
        await schema.parseAsync(limitData);
        
        return {
          isValid: true,
          errors: {},
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        const errors: Record<string, string> = {};
        
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors[err.path.join('.')] = err.message;
          });
        } else {
          errors.general = 'Rate limit validation failed';
        }
        
        return {
          isValid: false,
          errors,
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      }
    }, 'rate-limit-validation');
  }, [schemas.rateLimit, executeWithPerformanceTracking]);

  /**
   * Validate API security configuration
   */
  const validateApiSecurity = useCallback(async (securityData: any): Promise<SecurityValidationResult> => {
    return executeWithPerformanceTracking(async () => {
      try {
        const schema = schemas.apiSecurity || ApiSecurityValidationSchema;
        await schema.parseAsync(securityData);
        
        return {
          isValid: true,
          errors: {},
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        const errors: Record<string, string> = {};
        
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors[err.path.join('.')] = err.message;
          });
        } else {
          errors.general = 'API security validation failed';
        }
        
        return {
          isValid: false,
          errors,
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      }
    }, 'api-security-validation');
  }, [schemas.apiSecurity, executeWithPerformanceTracking]);

  /**
   * Validate access policy
   */
  const validateAccessPolicy = useCallback(async (policyData: any): Promise<SecurityValidationResult> => {
    return executeWithPerformanceTracking(async () => {
      try {
        const schema = schemas.accessPolicy || AccessPolicyValidationSchema;
        await schema.parseAsync(policyData);
        
        return {
          isValid: true,
          errors: {},
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        const errors: Record<string, string> = {};
        
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors[err.path.join('.')] = err.message;
          });
        } else {
          errors.general = 'Access policy validation failed';
        }
        
        return {
          isValid: false,
          errors,
          warnings: {},
          metrics: {
            executionTime: Date.now() - Date.now(),
            rulesEvaluated: 1,
            timestamp: new Date(),
          },
        };
      }
    }, 'access-policy-validation');
  }, [schemas.accessPolicy, executeWithPerformanceTracking]);

  /**
   * Execute custom security rules
   */
  const executeSecurityRules = useCallback(async (
    data: TFieldValues,
    rules?: SecurityRule<TFieldValues>[]
  ): Promise<SecurityValidationResult> => {
    const rulesToExecute = rules || customRules;
    return executeWithPerformanceTracking(async () => {
      const startTime = Date.now();
      const errors: Record<string, string> = {};
      const warnings: Record<string, string> = {};
      let rulesEvaluated = 0;
      
      for (const rule of rulesToExecute.filter(r => r.enabled)) {
        try {
          const result = await rule.validate(data, context);
          rulesEvaluated++;
          
          if (!result.success) {
            if (result.error) {
              errors[rule.id] = result.error;
            }
            if (result.warning) {
              warnings[rule.id] = result.warning;
            }
          }
        } catch (error) {
          errors[rule.id] = `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
        metrics: {
          executionTime: Date.now() - startTime,
          rulesEvaluated,
          timestamp: new Date(),
        },
      };
    }, 'security-rules-execution');
  }, [customRules, context, executeWithPerformanceTracking]);

  // =============================================================================
  // REACT HOOK FORM INTEGRATION
  // =============================================================================

  /**
   * Get validation errors formatted for React Hook Form
   */
  const getFormErrors = useCallback((): FieldErrors<TFieldValues> => {
    const formErrors: FieldErrors<TFieldValues> = {};
    
    Object.entries(validationErrors).forEach(([key, message]) => {
      const fieldPath = key as Path<TFieldValues>;
      formErrors[fieldPath] = {
        type: 'validation',
        message,
      } as FieldError;
    });
    
    return formErrors;
  }, [validationErrors]);

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback((fieldName?: Path<TFieldValues>) => {
    if (fieldName) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      setValidationWarnings(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    } else {
      setValidationErrors({});
      setValidationWarnings({});
    }
  }, []);

  // =============================================================================
  // CLEANUP
  // =============================================================================

  useEffect(() => {
    return () => {
      // Clear all debounce timeouts
      debounceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      debounceTimeoutsRef.current.clear();
      
      // Clear validation cache
      validationCacheRef.current.clear();
      
      // Clear active validations
      activeValidationsRef.current.clear();
    };
  }, []);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    validateField,
    validateForm,
    validatePermissions,
    validateRole,
    validateRateLimit,
    validateApiSecurity,
    validateAccessPolicy,
    executeSecurityRules,
    hasPermission,
    getFormErrors,
    clearErrors,
    isValidating,
    validationMetrics,
    validationErrors,
    validationWarnings,
  };
}

// =============================================================================
// EXPORT DEFAULT SCHEMAS FOR CONVENIENCE
// =============================================================================

export {
  RoleValidationSchema,
  RateLimitValidationSchema,
  ApiSecurityValidationSchema,
  AccessPolicyValidationSchema,
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  SecurityValidationContext,
  SecurityValidationResult,
  SecurityRule,
  SecurityRuleCategory,
  SecurityRuleCondition,
  SecurityRuleResult,
  PermissionValidationConfig,
  ValidationPerformanceConfig,
  UseSecurityValidationConfig,
  UseSecurityValidationReturn,
};