/**
 * Database Service Form Module - Barrel Export File
 * 
 * Centralized export interface for the database service form module, providing
 * comprehensive access to all service form components, hooks, types, and utilities.
 * Implements React 19 stable features with TypeScript 5.8+ module system for optimal
 * tree-shaking performance in Turbopack build pipeline.
 * 
 * This barrel file serves as the primary API surface for importing service form
 * functionality throughout the application, organized by category for clear
 * separation of concerns and enhanced developer experience.
 * 
 * Architecture:
 * - Components: React 19 functional components with TypeScript strict mode
 * - Hooks: Custom React hooks with SWR/React Query integration
 * - Types: Comprehensive TypeScript interfaces and Zod schemas
 * - Constants: Configuration objects and default values
 * - Utilities: Helper functions and type guards
 * 
 * @fileoverview Barrel export for database service form module
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// =============================================================================
// PRIMARY COMPONENTS
// =============================================================================

/**
 * Main service form components for database configuration workflows
 * These components implement the complete service creation and editing experience
 */
export {
  ServiceFormContainer,
  default as ServiceFormContainerWithSuspense
} from './service-form-container';

export {
  ServiceFormWizard,
  default as ServiceFormWizardDefault
} from './service-form-wizard';

export {
  PaywallModal,
  default as PaywallModalDefault
} from './paywall-modal';

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Custom React hooks for service form state management and data operations
 * Implements React Hook Form integration with comprehensive validation
 */
export {
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields,
  useServiceConnectionTest,
  useServiceFormPaywall,
  useServiceFormSecurity,
  useServiceFormSubmission,
  ServiceFormQueryKeys
} from './service-form-hooks';

// =============================================================================
// TYPESCRIPT INTERFACES AND TYPES
// =============================================================================

/**
 * Component Props Interfaces
 * TypeScript interfaces for React component props with strict typing
 */
export type {
  ServiceFormContainerComponentProps,
  ServiceFormWizardComponentProps,
  PaywallModalProps,
  DynamicFieldProps,
  WizardStepProps,
  FieldRendererProps
} from './service-form-types';

/**
 * Container and Navigation Types
 * State management and routing interfaces for service form flows
 */
export type {
  ContainerState,
  ServiceFormRouteParams,
  ServiceFormSearchParams,
  NavigationConfig
} from './service-form-container';

/**
 * Hook Return Types
 * TypeScript interfaces for custom hook return values
 */
export type {
  UseServiceFormReturn,
  UseServiceFormWizardReturn,
  UseDynamicFieldsReturn,
  UseConnectionTestReturn,
  UsePaywallAccessReturn
} from './service-form-hooks';

/**
 * Core Data Types
 * Primary data structures for service form operations
 */
export type {
  ServiceFormData,
  ServiceFormInput,
  ServiceFormMode,
  ServiceFormState,
  ServiceFormConfiguration,
  WizardDatabaseConnectionFormData,
  ServiceFormSubmissionState,
  ServiceFormSubmissionResult
} from './service-form-types';

/**
 * Wizard and Step Types
 * Multi-step wizard configuration and navigation interfaces
 */
export type {
  WizardStep,
  WizardStepDefinition,
  WizardNavigationState,
  WizardStepProgress,
  WizardStepValidationState,
  WizardStepKey,
  StepContext
} from './service-form-types';

/**
 * Form Field and Validation Types
 * Dynamic field configuration and validation interfaces
 */
export type {
  DynamicFieldConfig,
  FieldContext,
  FieldDependency,
  FieldValidationRule,
  FieldAccessibilityOptions,
  FormFieldError
} from './service-form-types';

/**
 * Paywall and Access Control Types
 * Premium feature access and subscription management interfaces
 */
export type {
  PaywallModalState,
  PaywallFeatureAccess,
  PaywallState,
  PaywallUpgradeOption,
  PaywallComponentProps,
  PremiumServiceConfig,
  ServiceTierAccess
} from './service-form-types';

/**
 * Security Configuration Types
 * Service security and access control interfaces
 */
export type {
  ServiceSecurityConfig,
  ServiceAdvancedConfig,
  SecurityConfiguration,
  PaywallConfiguration
} from './service-form-types';

/**
 * Connection Testing Types
 * Database connection validation and testing interfaces
 */
export type {
  FormConnectionTestProps,
  ConnectionTestProgress,
  ConnectionTestAdvancedOptions
} from './service-form-types';

/**
 * Paywall Modal Specific Types
 * Types specific to paywall modal functionality
 */
export type {
  ContactFormData,
  CalendlyConfig,
  FeatureHighlight
} from './paywall-modal';

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Form Validation Schemas
 * Zod schemas for comprehensive form validation with type inference
 */
export {
  ServiceFormSchema,
  ServiceTypeSelectionSchema,
  BasicServiceInfoSchema,
  ConnectionConfigSchema,
  SecurityConfigSchema,
  AdvancedConfigSchema,
  ServiceFormStepSchema,
  ServiceFormWizardNavigationSchema,
  WizardDatabaseConnectionSchema,
  PaywallConfigurationSchema,
  SecurityConfigurationSchema,
  ServiceFormConfigurationSchema
} from './service-form-types';

/**
 * Paywall Modal Schemas
 * Validation schemas for paywall and contact form functionality
 */
export {
  ContactFormSchema
} from './paywall-modal';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Wizard Configuration Constants
 * Default step definitions and wizard flow configuration
 */
export {
  DEFAULT_WIZARD_STEPS,
  WIZARD_STEPS
} from './service-form-types';

/**
 * Paywall Configuration Constants
 * Premium service configurations and tier mappings
 */
export {
  PREMIUM_SERVICES,
  TIER_FEATURES,
  CALENDLY_CONFIGS
} from './paywall-modal';

// =============================================================================
// UTILITY FUNCTIONS AND TYPE GUARDS
// =============================================================================

/**
 * Type Guard Functions
 * Runtime type checking utilities for form data validation
 */
export {
  isWizardFormData,
  isServiceFormStep,
  isPaywallConfiguration
} from './service-form-types';

/**
 * Form Data Utilities
 * Helper functions for form data creation and validation
 */
export {
  createInitialWizardFormData,
  validateStepCompletion
} from './service-form-types';

// =============================================================================
// RE-EXPORTED TYPES FOR CONVENIENCE
// =============================================================================

/**
 * Commonly Used Types
 * Re-exported with simplified names for external consumption
 */
export type {
  WizardDatabaseConnectionFormData as ServiceFormData,
  ServiceFormWizardComponentProps as WizardProps,
  ServiceFormContainerComponentProps as ContainerProps,
  DynamicFieldProps as FieldProps,
  ServiceFormState as FormState,
  WizardStepDefinition as StepDefinition,
  PaywallState as PaywallState
} from './service-form-types';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module version and compatibility information
 */
export const SERVICE_FORM_MODULE_VERSION = '1.0.0';
export const REACT_VERSION_REQUIRED = '19.0.0';
export const TYPESCRIPT_VERSION_REQUIRED = '5.8.0';
export const NEXTJS_VERSION_REQUIRED = '15.1.0';

/**
 * Feature flags for progressive enhancement
 */
export const SERVICE_FORM_FEATURES = {
  WIZARD_MODE: true,
  PAYWALL_INTEGRATION: true,
  CONNECTION_TESTING: true,
  SCHEMA_DISCOVERY: true,
  SECURITY_CONFIGURATION: true,
  AUTO_SAVE: true,
  REAL_TIME_VALIDATION: true,
  CALENDLY_INTEGRATION: true,
  ACCESSIBILITY_ENHANCEMENTS: true,
  DARK_MODE_SUPPORT: true,
  MOBILE_RESPONSIVE: true,
  TURBOPACK_OPTIMIZED: true
} as const;

/**
 * Supported database drivers for service form
 */
export const SUPPORTED_DATABASE_DRIVERS = [
  'mysql',
  'pgsql', 
  'sqlite',
  'sqlsrv',
  'mongodb',
  'oracle',
  'snowflake',
  'ibmdb2',
  'informix',
  'sqlanywhere',
  'memsql',
  'salesforce_db',
  'hana',
  'apache_hive',
  'databricks',
  'dremio'
] as const;

/**
 * Service tier hierarchy for paywall functionality
 */
export const SERVICE_TIER_HIERARCHY = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3
} as const;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the main service form container component
 * This enables both named and default import patterns for flexibility
 */
export { ServiceFormContainer as default } from './service-form-container';