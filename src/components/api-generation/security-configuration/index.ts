/**
 * Security Configuration Components Export Barrel
 * 
 * Central export hub for all API security management components, providing
 * clean imports and tree-shaking friendly exports for the API generation
 * security configuration workflow per React/Next.js integration requirements.
 * 
 * This module implements F-004: API Security Configuration feature requirements
 * including role-based access controls, API key management, and endpoint-level
 * security rules as specified in Section 2.1 Feature Catalog.
 * 
 * Features exported:
 * - Security configuration form with comprehensive validation
 * - API key management with secure generation and assignment
 * - Role-based access control (RBAC) with granular permissions
 * - Endpoint-level security rule configuration
 * - Custom hooks for security operations
 * - TypeScript type definitions for security domain
 * 
 * @fileoverview Export barrel for security configuration components
 * @version 1.0.0
 * @implements F-004: API Security Configuration
 * @performance Tree-shaking optimized exports for Turbopack bundling
 */

// =============================================================================
// MAIN COMPONENTS - Core security configuration interfaces
// =============================================================================

/**
 * Primary security configuration form component providing comprehensive
 * security rule management for generated APIs including role assignments,
 * access controls, and endpoint permissions.
 * 
 * Features:
 * - React Hook Form with Zod schema validation
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Role-based access control (RBAC) configuration
 * - API key management with generation and rotation
 * - Endpoint-level security rules and access restrictions
 * - Next.js middleware authentication integration
 * - WCAG 2.1 AA accessibility compliance
 * - Dark theme support via Zustand store integration
 * 
 * @example
 * ```tsx
 * import { SecurityConfigForm } from '@/components/api-generation/security-configuration';
 * 
 * function SecurityPage() {
 *   return (
 *     <SecurityConfigForm
 *       initialConfig={securityConfig}
 *       onSave={handleConfigSave}
 *       availableRoles={roles}
 *     />
 *   );
 * }
 * ```
 */
export { SecurityConfigForm } from './SecurityConfigForm';

/**
 * Default export alias for SecurityConfigForm to support both named and default imports
 * following React component export patterns for enhanced developer experience.
 */
export { default as SecurityConfigFormDefault } from './SecurityConfigForm';

// =============================================================================
// API KEY MANAGEMENT - Secure key generation and lifecycle management
// =============================================================================

/**
 * API Key Manager component providing comprehensive API key administration
 * interface with secure key generation, service assignment, and lifecycle
 * management capabilities.
 * 
 * Features:
 * - Real-time API key listing with SWR caching (cache hits under 50ms)
 * - Secure API key generation using Web Crypto API
 * - Service assignment and permission management
 * - Permission-based access control
 * - Copy-to-clipboard functionality with security considerations
 * - Bulk operations support for enterprise workflows
 * - Responsive design with WCAG 2.1 AA compliance
 * 
 * @example
 * ```tsx
 * import { ApiKeyManager } from '@/components/api-generation/security-configuration';
 * 
 * function ApiKeysPage() {
 *   return <ApiKeyManager serviceId={currentServiceId} />;
 * }
 * ```
 */
export { default as ApiKeyManager } from './ApiKeyManager';

// =============================================================================
// ROLE-BASED ACCESS CONTROL - Comprehensive RBAC management
// =============================================================================

/**
 * Role-Based Access Control component for comprehensive role and permission
 * management enabling granular security configuration across services.
 * 
 * Features:
 * - Role creation, editing, and deletion with form validation
 * - Component-level access control evaluation
 * - React Query caching for role and permission data optimization
 * - Real-time permission updates with intelligent cache invalidation
 * - Service-specific role configuration and access management
 * - WCAG 2.1 AA compliant interface with keyboard navigation
 * - Screen reader support for accessibility compliance
 * 
 * @example
 * ```tsx
 * import { RoleBasedAccessControl } from '@/components/api-generation/security-configuration';
 * 
 * function RolesPage() {
 *   return (
 *     <RoleBasedAccessControl
 *       serviceId={serviceId}
 *       serviceName={serviceName}
 *       onRoleChange={handleRoleChange}
 *     />
 *   );
 * }
 * ```
 */
export { RoleBasedAccessControl } from './RoleBasedAccessControl';

/**
 * Default export alias for RoleBasedAccessControl component
 */
export { default as RoleBasedAccessControlDefault } from './RoleBasedAccessControl';

// =============================================================================
// ENDPOINT PERMISSIONS - Granular endpoint security configuration
// =============================================================================

/**
 * Endpoint Permissions component for configuring endpoint-level security rules
 * and permissions, enabling granular access control for individual API endpoints
 * with HTTP method-specific permission configuration.
 * 
 * Features:
 * - HTTP method selection with verb mask configuration
 * - Requestor type access control (API Key, Session Token, JWT, etc.)
 * - Dynamic filter rules with field-level validation
 * - Real-time form validation under 100ms response time
 * - Rate limiting configuration per endpoint
 * - CORS policy management for cross-origin requests
 * - Next.js middleware integration for security rule evaluation
 * 
 * @example
 * ```tsx
 * import { EndpointPermissions } from '@/components/api-generation/security-configuration';
 * 
 * function EndpointSecurityPage() {
 *   return (
 *     <EndpointPermissions
 *       serviceId={serviceId}
 *       endpointId={endpointId}
 *       initialData={securityConfig}
 *       onSave={handleSecuritySave}
 *     />
 *   );
 * }
 * ```
 */
export { EndpointPermissions } from './EndpointPermissions';

/**
 * Default export alias for EndpointPermissions component
 */
export { default as EndpointPermissionsDefault } from './EndpointPermissions';

// =============================================================================
// CUSTOM HOOKS - Reusable security operation hooks
// =============================================================================

/**
 * Custom React hook for API key management operations including creation,
 * deletion, rotation, and service assignment with SWR-powered caching
 * and intelligent synchronization.
 * 
 * Features:
 * - SWR/React Query for intelligent caching and synchronization
 * - Cache hit responses under 50ms per integration requirements
 * - Secure API key generation using Web Crypto API
 * - Service assignment and management operations
 * - Real-time data fetching with automatic revalidation
 * - Error handling with retry mechanisms
 * - TypeScript support with comprehensive type definitions
 * 
 * @example
 * ```tsx
 * import { useApiKeys } from '@/components/api-generation/security-configuration';
 * 
 * function MyComponent() {
 *   const { 
 *     apiKeys, 
 *     isLoading, 
 *     createApiKey, 
 *     deleteApiKey,
 *     assignToService 
 *   } = useApiKeys();
 *   
 *   // Use API key operations...
 * }
 * ```
 */
export { useApiKeys } from './hooks/useApiKeys';

// =============================================================================
// TYPE DEFINITIONS - Security domain TypeScript types
// =============================================================================

/**
 * Core security type definitions for API security configuration including
 * roles, permissions, API keys, and endpoint security rules.
 * 
 * Exported types support:
 * - Type-safe security configuration workflows
 * - Role and permission management interfaces
 * - API key lifecycle management types
 * - Endpoint security rule definitions
 * - Form validation schemas and interfaces
 * - Integration with React Hook Form and Zod validators
 * 
 * Types include:
 * - SecurityConfig: Main security configuration interface
 * - Role: Role definition with permissions and metadata
 * - Permission: Permission definition with resource access
 * - ApiKey: API key with metadata and service assignments
 * - EndpointRule: Endpoint-level security rule configuration
 * - SecurityFormData: Form data interfaces for validation
 * 
 * @example
 * ```tsx
 * import type { 
 *   SecurityConfig,
 *   Role,
 *   ApiKey,
 *   EndpointRule 
 * } from '@/components/api-generation/security-configuration';
 * 
 * const config: SecurityConfig = {
 *   enableRBAC: true,
 *   roles: roles,
 *   apiKeys: keys,
 *   endpointRules: rules
 * };
 * ```
 */
export type {
  // Core security configuration types
  SecurityConfig,
  SecurityRole,
  SecurityPermission,
  
  // API key management types
  ApiKey,
  CreateApiKeyRequest,
  ApiKeyAssignment,
  ApiKeyFilter,
  
  // Role-based access control types
  Role,
  Permission,
  RoleServiceAccess,
  RoleFormData,
  
  // Endpoint security types
  EndpointRule,
  EndpointSecurityConfig,
  HttpMethod,
  RequestorType,
  SecurityFilter,
  
  // Form and validation types
  SecurityConfigFormData,
  SecurityValidationSchema,
  SecurityFormProps,
  
  // Hook return types
  UseApiKeysReturn,
  UseSecurityConfigReturn,
  UseRolesReturn,
  
  // Component prop types
  SecurityConfigFormProps,
  ApiKeyManagerProps,
  RoleBasedAccessControlProps,
  EndpointPermissionsProps,
} from '../../../types/security';

// =============================================================================
// UTILITY FUNCTIONS - Security-related utility functions
// =============================================================================

/**
 * Utility functions for security operations including API key generation,
 * permission validation, and security rule evaluation.
 * 
 * Functions include:
 * - generateSecureApiKey: Secure API key generation using Web Crypto API
 * - validatePermissions: Permission validation against role definitions
 * - evaluateSecurityRules: Security rule evaluation for endpoint access
 * - encryptCredentials: Credential encryption for secure storage
 * - formatSecurityConfig: Configuration formatting for display
 * 
 * @example
 * ```tsx
 * import { 
 *   generateSecureApiKey,
 *   validatePermissions 
 * } from '@/components/api-generation/security-configuration';
 * 
 * const apiKey = await generateSecureApiKey();
 * const hasPermission = validatePermissions(userRoles, requiredPermissions);
 * ```
 */
export {
  generateSecureApiKey,
  validatePermissions,
  evaluateSecurityRules,
  encryptCredentials,
  formatSecurityConfig,
  validateSecurityConfig,
  mergeSecurityConfigs,
  cloneSecurityConfig,
} from '../../../lib/utils/security';

// =============================================================================
// CONSTANTS AND ENUMS - Security configuration constants
// =============================================================================

/**
 * Security configuration constants and enumerations for standardized
 * security configuration across the application.
 * 
 * Constants include:
 * - HTTP_METHODS: Available HTTP methods for endpoint configuration
 * - REQUESTOR_TYPES: Authentication types for endpoint access
 * - PERMISSION_CATEGORIES: Permission categorization for role management
 * - SECURITY_LEVELS: Security level definitions for endpoint classification
 * - DEFAULT_SECURITY_CONFIG: Default security configuration values
 * - VALIDATION_RULES: Security validation rule definitions
 * 
 * @example
 * ```tsx
 * import { 
 *   HTTP_METHODS,
 *   REQUESTOR_TYPES,
 *   DEFAULT_SECURITY_CONFIG 
 * } from '@/components/api-generation/security-configuration';
 * 
 * const verbMask = HTTP_METHODS.GET | HTTP_METHODS.POST;
 * const requestorMask = REQUESTOR_TYPES.SESSION_TOKEN | REQUESTOR_TYPES.API_KEY;
 * ```
 */
export {
  HTTP_METHODS,
  REQUESTOR_TYPES,
  PERMISSION_CATEGORIES,
  SECURITY_LEVELS,
  DEFAULT_SECURITY_CONFIG,
  VALIDATION_RULES,
  API_KEY_EXPIRATION_OPTIONS,
  RATE_LIMIT_PERIODS,
  CORS_POLICY_OPTIONS,
} from '../../../lib/constants/security';

// =============================================================================
// VALIDATION SCHEMAS - Zod schemas for security configuration validation
// =============================================================================

/**
 * Zod validation schemas for security configuration forms ensuring type safety
 * and comprehensive validation across all security interfaces.
 * 
 * Schemas include:
 * - SecurityConfigSchema: Main security configuration validation
 * - RoleSchema: Role definition validation with permissions
 * - ApiKeySchema: API key creation and management validation
 * - EndpointRuleSchema: Endpoint security rule validation
 * - PermissionSchema: Permission definition validation
 * - SecurityFormSchema: Form-specific validation schemas
 * 
 * @example
 * ```tsx
 * import { 
 *   SecurityConfigSchema,
 *   RoleSchema 
 * } from '@/components/api-generation/security-configuration';
 * 
 * const validatedConfig = SecurityConfigSchema.parse(userConfig);
 * const validatedRole = RoleSchema.parse(roleData);
 * ```
 */
export {
  SecurityConfigSchema,
  RoleSchema,
  ApiKeySchema,
  EndpointRuleSchema,
  PermissionSchema,
  SecurityFormSchema,
  CreateApiKeySchema,
  UpdateRoleSchema,
  EndpointSecuritySchema,
} from '../../../lib/schemas/security';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE - Common external dependencies
// =============================================================================

/**
 * Re-export commonly used external dependencies for convenience and
 * consistent imports across security configuration components.
 * 
 * Re-exports include:
 * - React Hook Form components and hooks
 * - Headless UI components for accessibility
 * - Heroicons for consistent iconography
 * - Utility functions for common operations
 * 
 * This follows React/Next.js integration requirements for modular
 * component architecture and enhanced developer experience.
 */
export { useForm, Controller, useFieldArray } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';
export { z } from 'zod';

// Headless UI components for accessibility compliance
export {
  Dialog,
  DialogPanel,
  DialogTitle,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Switch,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

// Heroicons for consistent security-related iconography
export {
  KeyIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// MODULE METADATA - Export barrel metadata and version information
// =============================================================================

/**
 * Module metadata for the security configuration export barrel
 * providing version information and feature compliance details.
 */
export const SECURITY_MODULE_METADATA = {
  name: 'security-configuration',
  version: '1.0.0',
  description: 'API Security Configuration Components',
  features: [
    'F-004: API Security Configuration',
    'React/Next.js Integration Requirements',
    'Next.js middleware-based authentication',
    'RBAC implementation per Section 4.5',
    'Turbopack optimization support',
  ],
  performance: {
    validation: 'Real-time validation under 100ms',
    caching: 'Cache hit responses under 50ms',
    rendering: 'Component rendering optimized for SSR',
  },
  accessibility: 'WCAG 2.1 AA compliant',
  security: 'Enterprise-grade security controls',
  testing: 'MSW integration for development and testing',
} as const;

/**
 * Export barrel version for compatibility tracking
 */
export const EXPORT_BARREL_VERSION = '1.0.0';

/**
 * Feature compliance indicator for F-004 API Security Configuration
 */
export const F004_COMPLIANCE = true;