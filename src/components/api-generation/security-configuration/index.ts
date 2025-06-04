/**
 * Security Configuration Module - Export Barrel
 * 
 * Central export point for all API security configuration components, hooks, and utilities.
 * This module replaces Angular authentication guards with Next.js middleware patterns 
 * and provides React components for comprehensive API security management.
 * 
 * Features:
 * - Role-based access control (RBAC) configuration
 * - API key management and administration
 * - Endpoint-level security rules and permissions
 * - Security configuration forms with React Hook Form + Zod validation
 * - Tree-shaking optimized exports for Turbopack performance
 * 
 * @see Section 0.2.1 - React/Next.js module organization patterns
 * @see Section 4.5 - Security and Authentication Flows
 * @see F-004 - API Security Configuration requirements
 */

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Primary security configuration form component with comprehensive rule management.
 * Provides tabbed interface for role assignments, API keys, endpoint permissions,
 * and advanced security settings using React Hook Form with real-time validation.
 */
export { default as SecurityConfigForm } from './SecurityConfigForm';

/**
 * API key administration interface for creating, managing, and assigning API keys.
 * Features secure key generation, caching with React Query, and Next.js serverless
 * endpoint integration for secure session handling.
 */
export { default as ApiKeyManager, ApiKeyManager } from './ApiKeyManager';

/**
 * Role-based access control configuration component for role creation and 
 * permission assignment. Implements component-level access control evaluation
 * with React Query caching for optimal performance.
 */
export { default as RoleBasedAccessControl } from './RoleBasedAccessControl';

/**
 * Endpoint-level security rules configuration with granular permission control.
 * Enables HTTP method-specific permissions, request filtering, and advanced
 * access control patterns for individual API endpoints.
 */
export { default as EndpointPermissions, EndpointPermissions } from './EndpointPermissions';

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * React Query-powered hook for API key management operations.
 * Provides intelligent caching, secure key generation, and cache hit responses
 * under 50ms per React/Next.js Integration Requirements.
 */
export { useApiKeys } from './hooks/useApiKeys';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Re-export core security types for TypeScript consumers.
 * Provides type safety for security configuration, roles, permissions,
 * and endpoint access control throughout the application.
 */
export type {
  // Core Security Configuration
  SecurityConfiguration,
  SecurityConfigFormData,
  
  // Role-Based Access Control
  Role,
  RolePermission,
  RoleServiceAccess,
  
  // API Key Management
  ApiKeyInfo,
  ApiKeyRequest,
  ApiKeyResponse,
  
  // Endpoint Permissions
  EndpointPermission,
  EndpointFilter,
  EndpointRule,
  
  // HTTP Methods & Request Types
  VerbMask,
  RequestorMask,
  HttpMethod,
  RequestorType,
  
  // Filter Operations
  FilterOperator,
  FilterCondition,
  
  // Advanced Security Settings
  SecurityPolicy,
  CorsConfiguration,
  RateLimitConfig,
  AuditLogConfig
} from '@/types/security';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Security configuration utility functions for bitmask operations,
 * permission validation, and security rule evaluation.
 */
export {
  // Bitmask Operations
  calculateVerbMask,
  getMethodsFromVerbMask,
  hasMethod,
  toggleMethod,
  
  // Permission Utilities
  hasRequestorType,
  toggleRequestorType,
  validatePermissions,
  
  // Security Validation
  validateEndpointRule,
  validateApiKeyFormat,
  validateRoleConfiguration,
  
  // Filter Utilities
  buildFilterExpression,
  validateFilterCondition,
  
  // Configuration Helpers
  mergeSecurityConfigs,
  normalizeSecurityConfiguration
} from '@/lib/security-utils';

// =============================================================================
// COMPONENT COMPOSITION HELPERS
// =============================================================================

/**
 * Higher-order component for wrapping components with security context.
 * Provides access to current security configuration and permission state.
 */
export { withSecurityContext } from './hoc/withSecurityContext';

/**
 * React context provider for security configuration state management.
 * Enables shared security state across the security configuration module.
 */
export { SecurityConfigProvider, useSecurityConfig } from './context/SecurityConfigContext';

// =============================================================================
// CONSTANTS & CONFIGURATIONS
// =============================================================================

/**
 * HTTP method constants with bitmask values for permission calculation.
 * Used throughout the security configuration for verb mask operations.
 */
export const HTTP_VERBS = {
  GET: 1,      // 0001 - Read operations
  POST: 2,     // 0010 - Create operations  
  PUT: 4,      // 0100 - Update operations
  PATCH: 8,    // 1000 - Partial update operations
  DELETE: 16,  // 10000 - Delete operations
} as const;

/**
 * Requestor type constants with bitmask values for authentication method validation.
 * Defines supported authentication mechanisms for API access control.
 */
export const REQUESTOR_TYPES = {
  API_KEY: 1,        // API key authentication
  SESSION_TOKEN: 2,  // Session-based authentication  
  BASIC_AUTH: 4,     // HTTP Basic authentication
  JWT: 8,           // JWT token authentication
  OAUTH: 16,        // OAuth 2.0 authentication
} as const;

/**
 * Default security configuration template for new services.
 * Provides secure defaults following security best practices.
 */
export const DEFAULT_SECURITY_CONFIG: Partial<SecurityConfiguration> = {
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
    defaultPolicy: 'DENY', // Secure by default
    rules: [],
  },
  advancedSettings: {
    enableCORS: true,
    corsOrigins: ['*'], // Should be restricted in production
    enableCSRF: true,
    sessionTimeout: 30, // minutes
    maxFailedAttempts: 5,
    lockoutDuration: 15, // minutes
    enableAuditLogging: true,
    logLevel: 'INFO',
  },
} as const;

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module version and compatibility information for debugging and maintenance.
 */
export const SECURITY_MODULE_INFO = {
  version: '1.0.0',
  framework: 'React 19 + Next.js 15.1',
  replaces: 'Angular authentication guards',
  features: [
    'Role-based access control',
    'API key management', 
    'Endpoint-level permissions',
    'Security rule validation',
    'Next.js middleware integration'
  ],
  requirements: ['F-004'],
  lastUpdated: new Date().toISOString(),
} as const;