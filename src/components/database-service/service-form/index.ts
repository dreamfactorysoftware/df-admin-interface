/**
 * Database Service Form Module - Barrel Export
 * 
 * Centralized export interface for the database service form module, providing clean imports
 * for all components, hooks, types, and utilities. Supports tree-shaking optimization in
 * Turbopack build pipeline and follows React 19 ecosystem best practices for module organization.
 * 
 * This barrel export enables clean imports throughout the application:
 * ```typescript
 * import { ServiceFormContainer, useServiceForm, ServiceFormInput } from '@/components/database-service/service-form';
 * ```
 * 
 * @fileoverview Barrel export for database service form functionality
 * @version 1.0.0
 * @since 2024-01-01
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Core service form components for database service management
 */

// Service Form Container - Main orchestration component
export { 
  ServiceFormContainer,
  ServiceFormContainer as default,
  useServiceFormContext
} from './service-form-container';

// Service Form Wizard - Multi-step wizard component
export { default as ServiceFormWizard } from './service-form-wizard';

// Paywall Modal - Premium feature access control
export { 
  PaywallModal,
  PaywallModal as default as PaywallModalComponent
} from './paywall-modal';

// =============================================================================
// CUSTOM HOOKS EXPORTS
// =============================================================================

/**
 * React hooks for service form functionality and state management
 */

// Core form management hook with React Hook Form integration
export { useServiceForm } from './service-form-hooks';

// Multi-step wizard navigation and state management
export { useServiceFormWizard } from './service-form-hooks';

// Dynamic form field generation and configuration
export { useServiceFormFields } from './service-form-hooks';

// Connection testing with SWR caching
export { useServiceConnectionTest } from './service-form-hooks';

// Paywall access control and premium features
export { useServiceFormPaywall } from './service-form-hooks';

// Security configuration workflow management
export { useServiceFormSecurity } from './service-form-hooks';

// Form submission with React Query integration
export { useServiceFormSubmission } from './service-form-hooks';

// =============================================================================
// TYPE DEFINITIONS EXPORTS
// =============================================================================

/**
 * TypeScript interfaces and type definitions for type-safe development
 */

// Core service form types
export type {
  ServiceFormMode,
  ServiceFormSubmissionState,
  ServiceTierAccess,
  WizardStepValidationState,
  ServiceFormData,
  ServiceSecurityConfig,
  ServiceAdvancedConfig,
  RateLimitConfig,
  AuthenticationConfig,
  CachingConfig,
  LoggingConfig,
  MonitoringConfig,
  AlertingRule,
  PerformanceThresholds,
  PerformanceConfig,
  BackupConfig,
  MaintenanceConfig
} from './service-form-types';

// Wizard step and navigation types
export type {
  WizardStep,
  WizardNavigationState,
  WizardStepProgress,
  WizardStepKey
} from './service-form-types';

// Dynamic field configuration types
export type {
  DynamicFieldConfig,
  DynamicFieldType,
  DynamicFieldValidation,
  ConditionalLogic,
  FieldCondition,
  ComparisonOperator,
  ConditionalAction,
  FieldTransform,
  FieldWidth,
  GridConfig,
  SelectOption
} from './service-form-types';

// Paywall integration types
export type {
  PaywallModalState,
  PaywallFeatureAccess,
  PremiumServiceConfig,
  ServiceLimitation,
  UpgradeIncentive
} from './service-form-types';

// React component prop interfaces
export type {
  ServiceFormContainerProps,
  ServiceFormWizardProps,
  ServiceFormFieldsProps,
  DynamicFieldProps,
  PaywallModalProps,
  ServiceTypeSelectorProps,
  ConnectionTestProps,
  ServiceFormNavigationProps
} from './service-form-types';

// Hook return type interfaces
export type {
  UseServiceFormReturn,
  UseServiceFormWizardReturn,
  UseConnectionTestReturn,
  UsePaywallAccessReturn,
  UseDynamicFieldsReturn
} from './service-form-types';

// Form submission and analytics types
export type {
  FormFieldError,
  ServiceFormSubmissionResult,
  ServiceFormAnalyticsEvent
} from './service-form-types';

// Hook configuration interfaces
export type {
  ServiceFormConfig,
  WizardStepConfig,
  FormFieldConfig,
  ConnectionTestConfig,
  PaywallConfig,
  SecurityConfig
} from './service-form-hooks';

// Paywall modal component types
export type {
  CalendlyConfig
} from './paywall-modal';

// Service form context type
export type {
  ServiceFormContextValue
} from './service-form-container';

// =============================================================================
// VALIDATION SCHEMAS EXPORTS
// =============================================================================

/**
 * Zod validation schemas for form validation and type safety
 */

// Core validation schemas
export {
  ServiceFormSchema,
  ServiceTypeSelectionSchema,
  BasicServiceInfoSchema,
  ConnectionConfigSchema,
  SecurityConfigSchema,
  AdvancedConfigSchema
} from './service-form-types';

// Inferred types from schemas
export type {
  ServiceFormInput,
  ServiceTypeSelectionInput,
  BasicServiceInfoInput,
  ConnectionConfigInput,
  SecurityConfigInput,
  AdvancedConfigInput
} from './service-form-types';

// =============================================================================
// CONSTANTS AND CONFIGURATIONS EXPORTS
// =============================================================================

/**
 * Constants, default configurations, and utility values
 */

// Wizard step constants for type-safe step identification
export {
  WIZARD_STEPS,
  DEFAULT_WIZARD_STEPS
} from './service-form-types';

// =============================================================================
// RE-EXPORTED COMMON TYPES
// =============================================================================

/**
 * Commonly used types from base database service types for convenience
 */
export type {
  DatabaseService,
  DatabaseConfig,
  ServiceType,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ConnectionTestStatus,
  DatabaseConnectionInput,
  BaseComponentProps,
  ApiErrorResponse
} from './service-form-types';

// =============================================================================
// BARREL EXPORT METADATA
// =============================================================================

/**
 * Export metadata for development tooling and documentation
 */
export const SERVICE_FORM_MODULE_INFO = {
  name: 'DatabaseServiceForm',
  version: '1.0.0',
  description: 'Complete database service form management module for React/Next.js',
  components: [
    'ServiceFormContainer',
    'ServiceFormWizard', 
    'PaywallModal'
  ],
  hooks: [
    'useServiceForm',
    'useServiceFormWizard',
    'useServiceFormFields',
    'useServiceConnectionTest',
    'useServiceFormPaywall',
    'useServiceFormSecurity',
    'useServiceFormSubmission'
  ],
  schemas: [
    'ServiceFormSchema',
    'ServiceTypeSelectionSchema',
    'BasicServiceInfoSchema',
    'ConnectionConfigSchema',
    'SecurityConfigSchema',
    'AdvancedConfigSchema'
  ],
  dependencies: [
    'react',
    'react-hook-form',
    'zod',
    '@tanstack/react-query',
    'swr',
    '@headlessui/react'
  ]
} as const;