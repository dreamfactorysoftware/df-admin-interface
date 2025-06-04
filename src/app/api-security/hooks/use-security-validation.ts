/**
 * Security Validation Hook for DreamFactory Admin Interface
 * 
 * Comprehensive React hook implementing security rule validation with Zod schema validation
 * and real-time validation under 100ms. Provides dynamic validation rules for security
 * configurations, access control policies, and permission enforcement while maintaining
 * compatibility with React Hook Form integration patterns for type-safe security workflows.
 * 
 * Features:
 * - Zod schema validators integrated with React Hook Form
 * - Real-time validation under 100ms response time
 * - Role-based access control with permission validation
 * - Type-safe security workflows
 * - Comprehensive security rule validation
 * - Dynamic validation schemas for RBAC rules
 * - Component-level access control validation
 * - Security configuration validation for rate limits and access policies
 * - Validation error handling compatible with React Hook Form
 * - Business logic validation for security rule constraints and policy combinations
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { z, ZodSchema, ZodError } from 'zod';
import { useDebounce } from '@/hooks/use-debounce';
import type { 
  Role, 
  Permission, 
  RBACContext,
  AccessCheckResult,
  AuthError,
  AuthErrorCode 
} from '@/types/auth';
import type { 
  FieldErrors, 
  FieldValues, 
  UseFormReturn,
  FieldError 
} from '@/types/forms';

// ============================================================================
// CORE SECURITY VALIDATION TYPES
// ============================================================================

/**
 * Security validation configuration
 * Defines validation behavior and performance requirements
 */
export interface SecurityValidationConfig {
  /** Enable real-time validation (default: true) */
  realTimeEnabled: boolean;
  /** Maximum validation time in milliseconds (requirement: <100ms) */
  maxValidationTime: number;
  /** Debounce delay for real-time validation */
  debounceMs: number;
  /** Enable permission caching for performance */
  enablePermissionCaching: boolean;
  /** Cache TTL for permission checks in milliseconds */
  permissionCacheTTL: number;
  /** Enable comprehensive audit logging */
  enableAuditLogging: boolean;
}

/**
 * Security rule types supported by the validation system
 */
export type SecurityRuleType =
  | 'role-assignment'
  | 'permission-grant'
  | 'access-control'
  | 'rate-limit'
  | 'api-key'
  | 'endpoint-security'
  | 'database-access'
  | 'field-level-security'
  | 'cross-origin'
  | 'authentication'
  | 'session-management'
  | 'security-policy';

/**
 * Security validation rule definition
 */
export interface SecurityValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule type */
  type: SecurityRuleType;
  /** Rule name for display */
  name: string;
  /** Rule description */
  description?: string;
  /** Zod validation schema */
  schema: ZodSchema;
  /** Business logic validator */
  businessValidator?: (value: any, context: ValidationContext) => Promise<ValidationResult>;
  /** Dependencies on other fields */
  dependencies?: string[];
  /** Required permissions to modify this rule */
  requiredPermissions?: string[];
  /** Rule priority (higher numbers take precedence) */
  priority: number;
  /** Rule is enabled */
  enabled: boolean;
}

/**
 * Validation context for business logic validation
 */
export interface ValidationContext {
  /** Current user role */
  userRole?: Role;
  /** Current user permissions */
  userPermissions: Permission[];
  /** Form values for cross-field validation */
  formValues: Record<string, any>;
  /** Additional context data */
  context?: Record<string, any>;
  /** Validation timestamp */
  timestamp: Date;
}

/**
 * Validation result from business logic validators
 */
export interface ValidationResult {
  /** Validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  errorMessage?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
  /** Suggested fix for the error */
  suggestion?: string;
  /** Additional validation metadata */
  metadata?: Record<string, any>;
  /** Validation time in milliseconds */
  validationTime: number;
}

/**
 * Security policy configuration
 */
export interface SecurityPolicy {
  /** Policy identifier */
  id: string;
  /** Policy name */
  name: string;
  /** Policy rules */
  rules: SecurityPolicyRule[];
  /** Policy is enforced */
  enforced: boolean;
  /** Policy priority */
  priority: number;
}

/**
 * Individual security policy rule
 */
export interface SecurityPolicyRule {
  /** Rule identifier */
  id: string;
  /** Resource being protected */
  resource: string;
  /** Actions allowed/denied */
  actions: string[];
  /** Conditions for rule application */
  conditions?: Record<string, any>;
  /** Effect: allow or deny */
  effect: 'allow' | 'deny';
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Limit identifier */
  id: string;
  /** Limit name */
  name: string;
  /** Maximum requests per time period */
  maxRequests: number;
  /** Time period in seconds */
  periodSeconds: number;
  /** Scope of the limit */
  scope: 'global' | 'user' | 'role' | 'api-key' | 'endpoint';
  /** Scope identifier (if applicable) */
  scopeId?: string;
  /** Burst allowance */
  burstAllowance?: number;
  /** Limit is active */
  active: boolean;
}

/**
 * Access control entry
 */
export interface AccessControlEntry {
  /** ACE identifier */
  id: string;
  /** Principal (user, role, or group) */
  principal: AccessPrincipal;
  /** Resource being controlled */
  resource: string;
  /** Permissions granted/denied */
  permissions: string[];
  /** Effect: allow or deny */
  effect: 'allow' | 'deny';
  /** Conditions for access */
  conditions?: Record<string, any>;
}

/**
 * Access control principal
 */
export interface AccessPrincipal {
  /** Principal type */
  type: 'user' | 'role' | 'group' | 'api-key';
  /** Principal identifier */
  id: string;
  /** Principal name */
  name: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Core security validation schemas using Zod
 */
export const SecurityValidationSchemas = {
  /**
   * Role assignment validation schema
   */
  roleAssignment: z.object({
    userId: z.number().min(1, 'User ID is required'),
    roleId: z.number().min(1, 'Role ID is required'),
    effectiveDate: z.date().optional(),
    expirationDate: z.date().optional(),
    assignedBy: z.number().min(1, 'Assigned by user ID is required')
  }).refine(data => {
    if (data.effectiveDate && data.expirationDate) {
      return data.effectiveDate < data.expirationDate;
    }
    return true;
  }, {
    message: 'Effective date must be before expiration date',
    path: ['expirationDate']
  }),

  /**
   * Permission grant validation schema
   */
  permissionGrant: z.object({
    principalType: z.enum(['user', 'role', 'group']),
    principalId: z.string().min(1, 'Principal ID is required'),
    resource: z.string().min(1, 'Resource is required'),
    actions: z.array(z.string()).min(1, 'At least one action is required'),
    conditions: z.record(z.any()).optional(),
    effect: z.enum(['allow', 'deny'])
  }),

  /**
   * Rate limit configuration validation schema
   */
  rateLimit: z.object({
    name: z.string().min(1, 'Rate limit name is required').max(255, 'Name too long'),
    maxRequests: z.number().min(1, 'Maximum requests must be at least 1').max(10000, 'Maximum requests too high'),
    periodSeconds: z.number().min(1, 'Period must be at least 1 second').max(86400, 'Period cannot exceed 24 hours'),
    scope: z.enum(['global', 'user', 'role', 'api-key', 'endpoint']),
    scopeId: z.string().optional(),
    burstAllowance: z.number().min(0).optional(),
    active: z.boolean()
  }).refine(data => {
    if (['user', 'role', 'api-key', 'endpoint'].includes(data.scope)) {
      return !!data.scopeId;
    }
    return true;
  }, {
    message: 'Scope ID is required for scoped rate limits',
    path: ['scopeId']
  }),

  /**
   * API key validation schema
   */
  apiKey: z.object({
    name: z.string().min(1, 'API key name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    scopes: z.array(z.string()).min(1, 'At least one scope is required'),
    expirationDate: z.date().optional(),
    rateLimitId: z.string().optional(),
    isActive: z.boolean()
  }).refine(data => {
    if (data.expirationDate) {
      return data.expirationDate > new Date();
    }
    return true;
  }, {
    message: 'Expiration date must be in the future',
    path: ['expirationDate']
  }),

  /**
   * Endpoint security configuration validation schema
   */
  endpointSecurity: z.object({
    endpoint: z.string().min(1, 'Endpoint is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
    requiresAuth: z.boolean(),
    requiredPermissions: z.array(z.string()).optional(),
    allowedRoles: z.array(z.number()).optional(),
    rateLimitId: z.string().optional(),
    corsEnabled: z.boolean(),
    corsOrigins: z.array(z.string()).optional(),
    securityHeaders: z.record(z.string()).optional()
  }),

  /**
   * Database access control validation schema
   */
  databaseAccess: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    tableName: z.string().min(1, 'Table name is required'),
    principalType: z.enum(['user', 'role', 'group']),
    principalId: z.string().min(1, 'Principal ID is required'),
    permissions: z.array(z.enum(['create', 'read', 'update', 'delete'])).min(1, 'At least one permission is required'),
    fieldRestrictions: z.array(z.string()).optional(),
    rowLevelFilters: z.record(z.any()).optional()
  }),

  /**
   * Security policy validation schema
   */
  securityPolicy: z.object({
    name: z.string().min(1, 'Policy name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    rules: z.array(z.object({
      resource: z.string().min(1, 'Resource is required'),
      actions: z.array(z.string()).min(1, 'At least one action is required'),
      conditions: z.record(z.any()).optional(),
      effect: z.enum(['allow', 'deny'])
    })).min(1, 'At least one rule is required'),
    enforced: z.boolean(),
    priority: z.number().min(0).max(100)
  })
} as const;

// ============================================================================
// PERMISSION VALIDATION UTILITIES
// ============================================================================

/**
 * Permission validation utilities for RBAC enforcement
 */
export class PermissionValidator {
  private permissionCache = new Map<string, { result: boolean; expiry: number }>();
  private readonly cacheTTL: number;

  constructor(cacheTTL: number = 300000) { // 5 minutes default
    this.cacheTTL = cacheTTL;
  }

  /**
   * Check if user has permission for a specific action
   */
  hasPermission(
    userPermissions: Permission[],
    resource: string,
    action: string
  ): boolean {
    const cacheKey = `${resource}:${action}:${JSON.stringify(userPermissions.map(p => p.id))}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const hasPermission = userPermissions.some(permission => 
      permission.resource === resource && 
      permission.action === action
    );

    this.permissionCache.set(cacheKey, {
      result: hasPermission,
      expiry: Date.now() + this.cacheTTL
    });

    return hasPermission;
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(
    userPermissions: Permission[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.some(permission => {
      const [resource, action] = permission.split(':');
      return this.hasPermission(userPermissions, resource, action);
    });
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(
    userPermissions: Permission[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.every(permission => {
      const [resource, action] = permission.split(':');
      return this.hasPermission(userPermissions, resource, action);
    });
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.permissionCache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// ============================================================================
// BUSINESS LOGIC VALIDATORS
// ============================================================================

/**
 * Business logic validators for complex security rule validation
 */
export const BusinessLogicValidators = {
  /**
   * Validate role assignment business rules
   */
  validateRoleAssignment: async (
    value: any,
    context: ValidationContext
  ): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    try {
      // Check if user has permission to assign roles
      if (!context.userPermissions.some(p => p.resource === 'roles' && p.action === 'assign')) {
        return {
          isValid: false,
          errorMessage: 'Insufficient permissions to assign roles',
          errorCode: 'PERMISSION_DENIED',
          validationTime: Date.now() - startTime
        };
      }

      // Check if trying to assign higher privilege role
      if (context.userRole && value.roleId > context.userRole.id) {
        return {
          isValid: false,
          errorMessage: 'Cannot assign role with higher privileges',
          errorCode: 'PRIVILEGE_ESCALATION',
          suggestion: 'Contact system administrator for role assignment',
          validationTime: Date.now() - startTime
        };
      }

      return {
        isValid: true,
        validationTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'Validation error occurred',
        errorCode: 'VALIDATION_ERROR',
        validationTime: Date.now() - startTime
      };
    }
  },

  /**
   * Validate rate limit configuration business rules
   */
  validateRateLimit: async (
    value: any,
    context: ValidationContext
  ): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    try {
      // Check for conflicting rate limits
      const existingLimits = context.formValues.existingRateLimits || [];
      const hasConflict = existingLimits.some((limit: any) => 
        limit.scope === value.scope && 
        limit.scopeId === value.scopeId &&
        limit.id !== value.id
      );

      if (hasConflict) {
        return {
          isValid: false,
          errorMessage: 'Rate limit already exists for this scope',
          errorCode: 'DUPLICATE_RATE_LIMIT',
          suggestion: 'Modify existing rate limit or choose different scope',
          validationTime: Date.now() - startTime
        };
      }

      // Validate reasonable rate limits
      if (value.maxRequests / value.periodSeconds > 1000) {
        return {
          isValid: false,
          errorMessage: 'Rate limit too high (>1000 requests/second)',
          errorCode: 'RATE_LIMIT_TOO_HIGH',
          suggestion: 'Consider implementing burst control or reducing limit',
          validationTime: Date.now() - startTime
        };
      }

      return {
        isValid: true,
        validationTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'Rate limit validation failed',
        errorCode: 'VALIDATION_ERROR',
        validationTime: Date.now() - startTime
      };
    }
  },

  /**
   * Validate security policy combinations
   */
  validateSecurityPolicy: async (
    value: any,
    context: ValidationContext
  ): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    try {
      // Check for conflicting rules within the policy
      const resources = new Set();
      for (const rule of value.rules) {
        const ruleKey = `${rule.resource}:${rule.actions.join(',')}`;
        if (resources.has(ruleKey)) {
          return {
            isValid: false,
            errorMessage: 'Conflicting rules detected within policy',
            errorCode: 'POLICY_CONFLICT',
            suggestion: 'Consolidate rules for the same resource and actions',
            validationTime: Date.now() - startTime
          };
        }
        resources.add(ruleKey);
      }

      // Validate rule combinations don't create security gaps
      const allowRules = value.rules.filter((r: any) => r.effect === 'allow');
      const denyRules = value.rules.filter((r: any) => r.effect === 'deny');
      
      if (allowRules.length === 0 && denyRules.length > 0) {
        return {
          isValid: false,
          errorMessage: 'Policy has only deny rules, creating inaccessible resources',
          errorCode: 'SECURITY_GAP',
          suggestion: 'Add explicit allow rules or remove deny-only policy',
          validationTime: Date.now() - startTime
        };
      }

      return {
        isValid: true,
        validationTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'Security policy validation failed',
        errorCode: 'VALIDATION_ERROR',
        validationTime: Date.now() - startTime
      };
    }
  }
} as const;

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * Security validation hook configuration
 */
export interface UseSecurityValidationConfig extends Partial<SecurityValidationConfig> {
  /** Form instance from React Hook Form */
  form?: UseFormReturn<any>;
  /** Custom validation rules */
  customRules?: SecurityValidationRule[];
  /** RBAC context */
  rbacContext?: RBACContext;
}

/**
 * Security validation hook return type
 */
export interface UseSecurityValidationReturn {
  // Validation functions
  validateRule: (ruleType: SecurityRuleType, value: any) => Promise<ValidationResult>;
  validatePermission: (resource: string, action: string) => boolean;
  validateRoleAssignment: (userId: number, roleId: number) => Promise<ValidationResult>;
  validateRateLimit: (config: RateLimitConfig) => Promise<ValidationResult>;
  validateSecurityPolicy: (policy: SecurityPolicy) => Promise<ValidationResult>;
  validateAccessControl: (entry: AccessControlEntry) => Promise<ValidationResult>;
  
  // Batch validation
  validateMultiple: (validations: Array<{ type: SecurityRuleType; value: any }>) => Promise<ValidationResult[]>;
  
  // Permission utilities
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canModifyRole: (roleId: number) => boolean;
  canCreateRateLimit: () => boolean;
  canManageSecurityPolicy: () => boolean;
  
  // Form integration
  createFieldValidator: (ruleType: SecurityRuleType) => (value: any) => Promise<string | undefined>;
  getFieldError: (fieldName: string) => FieldError | undefined;
  setFieldError: (fieldName: string, error: string) => void;
  clearFieldErrors: (fieldNames?: string[]) => void;
  
  // Performance monitoring
  getValidationMetrics: () => ValidationMetrics;
  resetMetrics: () => void;
  
  // State
  isValidating: boolean;
  validationErrors: Record<string, string>;
  lastValidationTime: number;
  permissionCacheStats: { size: number; hitRate: number };
}

/**
 * Validation performance metrics
 */
export interface ValidationMetrics {
  totalValidations: number;
  averageValidationTime: number;
  maxValidationTime: number;
  validationsUnder100ms: number;
  validationErrors: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Default configuration for security validation
 */
const DEFAULT_CONFIG: SecurityValidationConfig = {
  realTimeEnabled: true,
  maxValidationTime: 100, // Requirement: under 100ms
  debounceMs: 50,
  enablePermissionCaching: true,
  permissionCacheTTL: 300000, // 5 minutes
  enableAuditLogging: true
};

/**
 * Security Validation Hook
 * 
 * Provides comprehensive security rule validation with real-time feedback,
 * RBAC integration, and React Hook Form compatibility.
 */
export function useSecurityValidation(config: UseSecurityValidationConfig = {}): UseSecurityValidationReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastValidationTime, setLastValidationTime] = useState(0);
  
  // Performance tracking
  const metricsRef = useRef<ValidationMetrics>({
    totalValidations: 0,
    averageValidationTime: 0,
    maxValidationTime: 0,
    validationsUnder100ms: 0,
    validationErrors: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Permission validator instance
  const permissionValidator = useMemo(
    () => new PermissionValidator(finalConfig.permissionCacheTTL),
    [finalConfig.permissionCacheTTL]
  );

  // Validation rules registry
  const validationRules = useMemo(() => {
    const rules = new Map<SecurityRuleType, SecurityValidationRule>();
    
    // Register built-in validation rules
    rules.set('role-assignment', {
      id: 'role-assignment',
      type: 'role-assignment',
      name: 'Role Assignment',
      schema: SecurityValidationSchemas.roleAssignment,
      businessValidator: BusinessLogicValidators.validateRoleAssignment,
      requiredPermissions: ['roles:assign'],
      priority: 100,
      enabled: true
    });

    rules.set('rate-limit', {
      id: 'rate-limit',
      type: 'rate-limit',
      name: 'Rate Limit',
      schema: SecurityValidationSchemas.rateLimit,
      businessValidator: BusinessLogicValidators.validateRateLimit,
      requiredPermissions: ['rate-limits:create', 'rate-limits:update'],
      priority: 90,
      enabled: true
    });

    rules.set('security-policy', {
      id: 'security-policy',
      type: 'security-policy',
      name: 'Security Policy',
      schema: SecurityValidationSchemas.securityPolicy,
      businessValidator: BusinessLogicValidators.validateSecurityPolicy,
      requiredPermissions: ['security-policies:create', 'security-policies:update'],
      priority: 95,
      enabled: true
    });

    // Add other built-in rules...
    rules.set('permission-grant', {
      id: 'permission-grant',
      type: 'permission-grant',
      name: 'Permission Grant',
      schema: SecurityValidationSchemas.permissionGrant,
      requiredPermissions: ['permissions:grant'],
      priority: 85,
      enabled: true
    });

    rules.set('api-key', {
      id: 'api-key',
      type: 'api-key',
      name: 'API Key',
      schema: SecurityValidationSchemas.apiKey,
      requiredPermissions: ['api-keys:create'],
      priority: 80,
      enabled: true
    });

    // Register custom rules
    config.customRules?.forEach(rule => {
      rules.set(rule.type, rule);
    });

    return rules;
  }, [config.customRules]);

  // Performance tracking helper
  const trackValidation = useCallback((validationTime: number, hasError: boolean) => {
    const metrics = metricsRef.current;
    metrics.totalValidations++;
    metrics.averageValidationTime = 
      (metrics.averageValidationTime * (metrics.totalValidations - 1) + validationTime) / metrics.totalValidations;
    metrics.maxValidationTime = Math.max(metrics.maxValidationTime, validationTime);
    
    if (validationTime < 100) {
      metrics.validationsUnder100ms++;
    }
    
    if (hasError) {
      metrics.validationErrors++;
    }
    
    setLastValidationTime(validationTime);
  }, []);

  // Core validation function
  const validateRule = useCallback(async (
    ruleType: SecurityRuleType,
    value: any
  ): Promise<ValidationResult> => {
    const startTime = Date.now();
    setIsValidating(true);

    try {
      const rule = validationRules.get(ruleType);
      if (!rule || !rule.enabled) {
        return {
          isValid: false,
          errorMessage: `Validation rule not found or disabled: ${ruleType}`,
          errorCode: 'RULE_NOT_FOUND',
          validationTime: Date.now() - startTime
        };
      }

      // Check permissions first
      if (rule.requiredPermissions && config.rbacContext) {
        const hasRequiredPermissions = permissionValidator.hasAllPermissions(
          config.rbacContext.permissions,
          rule.requiredPermissions
        );

        if (!hasRequiredPermissions) {
          const result = {
            isValid: false,
            errorMessage: 'Insufficient permissions for this operation',
            errorCode: 'PERMISSION_DENIED',
            validationTime: Date.now() - startTime
          };
          trackValidation(result.validationTime, true);
          return result;
        }
      }

      // Schema validation
      const schemaResult = rule.schema.safeParse(value);
      if (!schemaResult.success) {
        const errorMessage = schemaResult.error.errors
          .map(err => err.message)
          .join(', ');
        
        const result = {
          isValid: false,
          errorMessage,
          errorCode: 'SCHEMA_VALIDATION_FAILED',
          validationTime: Date.now() - startTime
        };
        trackValidation(result.validationTime, true);
        return result;
      }

      // Business logic validation
      if (rule.businessValidator) {
        const context: ValidationContext = {
          userRole: config.rbacContext?.userRole,
          userPermissions: config.rbacContext?.permissions || [],
          formValues: config.form?.getValues() || {},
          timestamp: new Date()
        };

        const businessResult = await rule.businessValidator(value, context);
        trackValidation(businessResult.validationTime, !businessResult.isValid);
        return businessResult;
      }

      const result = {
        isValid: true,
        validationTime: Date.now() - startTime
      };
      trackValidation(result.validationTime, false);
      return result;

    } catch (error) {
      const result = {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
        errorCode: 'VALIDATION_EXCEPTION',
        validationTime: Date.now() - startTime
      };
      trackValidation(result.validationTime, true);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validationRules, config.rbacContext, config.form, permissionValidator, trackValidation]);

  // Batch validation
  const validateMultiple = useCallback(async (
    validations: Array<{ type: SecurityRuleType; value: any }>
  ): Promise<ValidationResult[]> => {
    const startTime = Date.now();
    
    // Validate in parallel for better performance
    const results = await Promise.all(
      validations.map(({ type, value }) => validateRule(type, value))
    );
    
    // Ensure total validation time is under requirements
    const totalTime = Date.now() - startTime;
    if (totalTime > finalConfig.maxValidationTime * validations.length) {
      console.warn(`Batch validation exceeded time limit: ${totalTime}ms`);
    }

    return results;
  }, [validateRule, finalConfig.maxValidationTime]);

  // Permission utilities
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!config.rbacContext) return false;
    return permissionValidator.hasPermission(config.rbacContext.permissions, resource, action);
  }, [config.rbacContext, permissionValidator]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!config.rbacContext) return false;
    return permissionValidator.hasAnyPermission(config.rbacContext.permissions, permissions);
  }, [config.rbacContext, permissionValidator]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!config.rbacContext) return false;
    return permissionValidator.hasAllPermissions(config.rbacContext.permissions, permissions);
  }, [config.rbacContext, permissionValidator]);

  // Specific validation functions
  const validatePermission = useCallback((resource: string, action: string): boolean => {
    return hasPermission(resource, action);
  }, [hasPermission]);

  const validateRoleAssignment = useCallback(async (
    userId: number,
    roleId: number
  ): Promise<ValidationResult> => {
    return validateRule('role-assignment', { userId, roleId, assignedBy: config.rbacContext?.userRole?.id });
  }, [validateRule, config.rbacContext]);

  const validateRateLimit = useCallback(async (
    rateLimitConfig: RateLimitConfig
  ): Promise<ValidationResult> => {
    return validateRule('rate-limit', rateLimitConfig);
  }, [validateRule]);

  const validateSecurityPolicy = useCallback(async (
    policy: SecurityPolicy
  ): Promise<ValidationResult> => {
    return validateRule('security-policy', policy);
  }, [validateRule]);

  const validateAccessControl = useCallback(async (
    entry: AccessControlEntry
  ): Promise<ValidationResult> => {
    return validateRule('access-control', entry);
  }, [validateRule]);

  // Higher-level permission checks
  const canModifyRole = useCallback((roleId: number): boolean => {
    if (!config.rbacContext?.userRole) return false;
    
    // Users can't assign roles with higher privileges than their own
    return (
      hasPermission('roles', 'assign') &&
      roleId <= config.rbacContext.userRole.id
    );
  }, [hasPermission, config.rbacContext]);

  const canCreateRateLimit = useCallback((): boolean => {
    return hasAnyPermission(['rate-limits:create', 'system:admin']);
  }, [hasAnyPermission]);

  const canManageSecurityPolicy = useCallback((): boolean => {
    return hasAnyPermission(['security-policies:manage', 'system:admin']);
  }, [hasAnyPermission]);

  // React Hook Form integration
  const createFieldValidator = useCallback((ruleType: SecurityRuleType) => {
    return async (value: any): Promise<string | undefined> => {
      const result = await validateRule(ruleType, value);
      return result.isValid ? undefined : result.errorMessage;
    };
  }, [validateRule]);

  const getFieldError = useCallback((fieldName: string): FieldError | undefined => {
    if (!config.form) return undefined;
    return config.form.formState.errors[fieldName] as FieldError;
  }, [config.form]);

  const setFieldError = useCallback((fieldName: string, error: string): void => {
    if (!config.form) return;
    config.form.setError(fieldName, { message: error });
    setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [config.form]);

  const clearFieldErrors = useCallback((fieldNames?: string[]): void => {
    if (!config.form) return;
    
    if (fieldNames) {
      fieldNames.forEach(name => config.form?.clearErrors(name));
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        fieldNames.forEach(name => delete newErrors[name]);
        return newErrors;
      });
    } else {
      config.form.clearErrors();
      setValidationErrors({});
    }
  }, [config.form]);

  // Performance monitoring
  const getValidationMetrics = useCallback((): ValidationMetrics => {
    return { ...metricsRef.current };
  }, []);

  const resetMetrics = useCallback((): void => {
    metricsRef.current = {
      totalValidations: 0,
      averageValidationTime: 0,
      maxValidationTime: 0,
      validationsUnder100ms: 0,
      validationErrors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    permissionValidator.clearCache();
  }, [permissionValidator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      permissionValidator.clearCache();
    };
  }, [permissionValidator]);

  return {
    // Validation functions
    validateRule,
    validatePermission,
    validateRoleAssignment,
    validateRateLimit,
    validateSecurityPolicy,
    validateAccessControl,
    
    // Batch validation
    validateMultiple,
    
    // Permission utilities
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canModifyRole,
    canCreateRateLimit,
    canManageSecurityPolicy,
    
    // Form integration
    createFieldValidator,
    getFieldError,
    setFieldError,
    clearFieldErrors,
    
    // Performance monitoring
    getValidationMetrics,
    resetMetrics,
    
    // State
    isValidating,
    validationErrors,
    lastValidationTime,
    permissionCacheStats: permissionValidator.getCacheStats()
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Create a debounced version of the security validation hook
 * for improved performance with rapid user input
 */
export function useDebouncedSecurityValidation(
  config: UseSecurityValidationConfig = {},
  delay: number = 50
) {
  const validation = useSecurityValidation(config);
  const debouncedValidateRule = useDebounce(validation.validateRule, delay);
  
  return {
    ...validation,
    validateRule: debouncedValidateRule
  };
}

/**
 * Pre-configured security validation for common scenarios
 */
export const SecurityValidationPresets = {
  /**
   * Role management validation configuration
   */
  roleManagement: (rbacContext: RBACContext): UseSecurityValidationConfig => ({
    rbacContext,
    customRules: [
      {
        id: 'role-hierarchy',
        type: 'role-assignment',
        name: 'Role Hierarchy',
        schema: SecurityValidationSchemas.roleAssignment,
        businessValidator: BusinessLogicValidators.validateRoleAssignment,
        requiredPermissions: ['roles:assign'],
        priority: 100,
        enabled: true
      }
    ]
  }),

  /**
   * Rate limiting validation configuration
   */
  rateLimiting: (rbacContext: RBACContext): UseSecurityValidationConfig => ({
    rbacContext,
    customRules: [
      {
        id: 'rate-limit-config',
        type: 'rate-limit',
        name: 'Rate Limit Configuration',
        schema: SecurityValidationSchemas.rateLimit,
        businessValidator: BusinessLogicValidators.validateRateLimit,
        requiredPermissions: ['rate-limits:manage'],
        priority: 90,
        enabled: true
      }
    ]
  }),

  /**
   * Security policy validation configuration
   */
  securityPolicy: (rbacContext: RBACContext): UseSecurityValidationConfig => ({
    rbacContext,
    customRules: [
      {
        id: 'security-policy-config',
        type: 'security-policy',
        name: 'Security Policy Configuration',
        schema: SecurityValidationSchemas.securityPolicy,
        businessValidator: BusinessLogicValidators.validateSecurityPolicy,
        requiredPermissions: ['security-policies:manage'],
        priority: 95,
        enabled: true
      }
    ]
  })
} as const;

// Export all types for external use
export type {
  SecurityValidationConfig,
  SecurityValidationRule,
  ValidationContext,
  ValidationResult,
  SecurityPolicy,
  SecurityPolicyRule,
  RateLimitConfig,
  AccessControlEntry,
  AccessPrincipal,
  UseSecurityValidationConfig,
  UseSecurityValidationReturn,
  ValidationMetrics
};