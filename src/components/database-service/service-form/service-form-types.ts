/**
 * Database Service Form Component Types
 * 
 * TypeScript interface definitions, type exports, and Zod schema validators specific to 
 * database service form components. Defines type-safe contracts for service form operations,
 * wizard steps, dynamic field configurations, paywall states, and form validation schemas.
 * Provides comprehensive type safety for React Hook Form integration and service configuration workflows.
 * 
 * @fileoverview Comprehensive form types for database service management in React/Next.js
 * @version 1.0.0
 * @since 2024-01-01
 */

import { z } from 'zod';
import { ReactNode, ComponentType, FormEvent } from 'react';
import type { 
  UseFormReturn, 
  FieldValues, 
  FieldPath, 
  Control,
  FormState,
  FieldError,
  UseFormRegister,
  UseFormHandleSubmit,
  UseFormWatch,
  UseFormSetValue,
  UseFormTrigger,
  UseFormClearErrors,
  UseFormReset,
  Path,
  PathValue,
  UseFormSetError
} from 'react-hook-form';
import type { 
  UseQueryResult, 
  UseMutationResult,
  QueryKey
} from '@tanstack/react-query';
import type { SWRResponse } from 'swr';
import type { 
  DatabaseService,
  DatabaseConfig,
  ServiceType,
  ConfigSchema,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ConnectionTestStatus,
  DatabaseConnectionInput,
  SSLConfig,
  PoolingConfig,
  DatabaseOptions,
  BaseComponentProps,
  ApiErrorResponse
} from '../types';

// =============================================================================
// CORE SERVICE FORM TYPES
// =============================================================================

/**
 * Service form operation modes
 */
export type ServiceFormMode = 'create' | 'edit' | 'view' | 'clone';

/**
 * Service form submission states for UI feedback
 */
export type ServiceFormSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Service tier access levels for paywall integration
 */
export type ServiceTierAccess = 'free' | 'basic' | 'premium' | 'enterprise';

/**
 * Wizard step validation states
 */
export type WizardStepValidationState = 'pending' | 'valid' | 'invalid' | 'skipped';

// =============================================================================
// WIZARD STEP DEFINITIONS
// =============================================================================

/**
 * Wizard step configuration for multi-step service creation workflow
 */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  validationSchema?: z.ZodSchema<any>;
  fields: string[];
  optional?: boolean;
  conditionalDisplay?: (formData: any) => boolean;
  estimatedDuration?: number; // in minutes
  helpText?: string;
  warningText?: string;
}

/**
 * Wizard navigation state management
 */
export interface WizardNavigationState {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  validationStates: Map<number, WizardStepValidationState>;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;
}

/**
 * Wizard step progression tracking
 */
export interface WizardStepProgress {
  stepId: string;
  stepIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  isValid: boolean;
  hasError: boolean;
  errorMessage?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/**
 * Base service form data structure extending database connection input
 */
export interface ServiceFormData extends DatabaseConnectionInput {
  // Wizard-specific fields
  serviceTypeId?: string;
  displayLabel?: string;
  
  // Security configuration
  security?: ServiceSecurityConfig;
  
  // Advanced configuration
  advanced?: ServiceAdvancedConfig;
  
  // Paywall and licensing
  requiresPremium?: boolean;
  tierAccess?: ServiceTierAccess;
  
  // Metadata
  tags?: string[];
  category?: string;
  notes?: string;
}

/**
 * Security configuration for service access control
 */
export interface ServiceSecurityConfig {
  accessType: 'public' | 'private' | 'role-based' | 'api-key';
  allowedOrigins?: string[];
  rateLimiting?: RateLimitConfig;
  authentication?: AuthenticationConfig;
  roles?: string[];
  permissions?: string[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  requireHttps?: boolean;
  corsEnabled?: boolean;
  corsOrigins?: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstAllowance?: number;
  penaltyDuration?: number; // in minutes
}

/**
 * Authentication configuration options
 */
export interface AuthenticationConfig {
  type: 'none' | 'api-key' | 'jwt' | 'oauth' | 'basic';
  apiKeyHeader?: string;
  jwtSecret?: string;
  oauthProvider?: string;
  basicAuthRealm?: string;
  sessionTimeout?: number; // in minutes
  refreshTokenEnabled?: boolean;
}

/**
 * Advanced service configuration options
 */
export interface ServiceAdvancedConfig {
  caching?: CachingConfig;
  logging?: LoggingConfig;
  monitoring?: MonitoringConfig;
  performance?: PerformanceConfig;
  backup?: BackupConfig;
  maintenance?: MaintenanceConfig;
}

/**
 * Caching configuration for service optimization
 */
export interface CachingConfig {
  enabled: boolean;
  strategy: 'memory' | 'redis' | 'file' | 'database';
  ttl?: number; // in seconds
  maxSize?: number; // in MB
  compression?: boolean;
  invalidationRules?: string[];
}

/**
 * Logging configuration for service monitoring
 */
export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: 'console' | 'file' | 'database' | 'external';
  maxFileSize?: number; // in MB
  rotationDays?: number;
  includeQueryParams?: boolean;
  includeHeaders?: boolean;
  excludeFields?: string[];
}

/**
 * Monitoring configuration for service observability
 */
export interface MonitoringConfig {
  enabled: boolean;
  metricsEndpoint?: string;
  healthCheckInterval?: number; // in seconds
  alertingRules?: AlertingRule[];
  performanceThresholds?: PerformanceThresholds;
}

/**
 * Alerting rule configuration
 */
export interface AlertingRule {
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationChannels: string[];
  cooldownPeriod?: number; // in minutes
}

/**
 * Performance threshold definitions
 */
export interface PerformanceThresholds {
  responseTime: number; // in milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  uptime: number; // percentage
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  connectionPooling?: PoolingConfig;
  queryOptimization?: boolean;
  indexHints?: boolean;
  parallelQueries?: boolean;
  resultCaching?: boolean;
  compressionEnabled?: boolean;
  keepAliveTimeout?: number; // in seconds
}

/**
 * Backup configuration for data protection
 */
export interface BackupConfig {
  enabled: boolean;
  schedule?: string; // cron expression
  retentionDays?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  destination?: string;
  notificationOnFailure?: boolean;
}

/**
 * Maintenance configuration for service management
 */
export interface MaintenanceConfig {
  autoUpdatesEnabled?: boolean;
  maintenanceWindow?: string;
  notifyBeforeMaintenance?: boolean;
  notificationLeadTime?: number; // in hours
  allowDuringPeakHours?: boolean;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Core service form validation schema with enhanced validation rules
 */
export const ServiceFormSchema = z.object({
  // Basic service information
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'),
  
  label: z.string()
    .min(1, 'Display label is required')
    .max(255, 'Display label must be less than 255 characters'),
  
  description: z.string()
    .max(1024, 'Description must be less than 1024 characters')
    .optional(),
  
  // Service type and configuration
  type: z.enum([
    'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
    'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
    'apache_hive', 'databricks', 'dremio'
  ]),
  
  serviceTypeId: z.string().optional(),
  displayLabel: z.string().optional(),
  
  // Database connection configuration
  config: z.object({
    driver: z.enum([
      'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
      'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
      'apache_hive', 'databricks', 'dremio'
    ]),
    
    host: z.string()
      .min(1, 'Host is required')
      .max(255, 'Host must be less than 255 characters'),
    
    port: z.number()
      .int('Port must be an integer')
      .min(1, 'Port must be greater than 0')
      .max(65535, 'Port must be less than 65536')
      .optional(),
    
    database: z.string()
      .min(1, 'Database name is required')
      .max(64, 'Database name must be less than 64 characters'),
    
    username: z.string()
      .min(1, 'Username is required')
      .max(64, 'Username must be less than 64 characters'),
    
    password: z.string()
      .max(255, 'Password must be less than 255 characters')
      .optional(),
    
    options: z.record(z.any()).optional(),
    connectionTimeout: z.number().int().min(1000).max(60000).optional(),
    
    ssl: z.object({
      enabled: z.boolean(),
      verify: z.boolean().optional(),
      mode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']).optional(),
      ca: z.string().optional(),
      cert: z.string().optional(),
      key: z.string().optional(),
      rejectUnauthorized: z.boolean().optional()
    }).optional(),
    
    pooling: z.object({
      min: z.number().int().min(0),
      max: z.number().int().min(1),
      acquireTimeoutMillis: z.number().int().min(1000).optional(),
      createTimeoutMillis: z.number().int().min(1000).optional(),
      destroyTimeoutMillis: z.number().int().min(1000).optional(),
      idleTimeoutMillis: z.number().int().min(1000).optional(),
      reapIntervalMillis: z.number().int().min(1000).optional(),
      createRetryIntervalMillis: z.number().int().min(100).optional()
    }).optional()
  }),
  
  // Service status and metadata
  is_active: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  notes: z.string().max(2048).optional(),
  
  // Premium service configuration
  requiresPremium: z.boolean().optional(),
  tierAccess: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  
  // Security configuration schema
  security: z.object({
    accessType: z.enum(['public', 'private', 'role-based', 'api-key']),
    allowedOrigins: z.array(z.string().url()).optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
    ipBlacklist: z.array(z.string().ip()).optional(),
    requireHttps: z.boolean().optional(),
    corsEnabled: z.boolean().optional(),
    corsOrigins: z.array(z.string()).optional(),
    
    rateLimiting: z.object({
      enabled: z.boolean(),
      requestsPerMinute: z.number().int().min(1).optional(),
      requestsPerHour: z.number().int().min(1).optional(),
      requestsPerDay: z.number().int().min(1).optional(),
      burstAllowance: z.number().int().min(1).optional(),
      penaltyDuration: z.number().int().min(1).optional()
    }).optional(),
    
    authentication: z.object({
      type: z.enum(['none', 'api-key', 'jwt', 'oauth', 'basic']),
      apiKeyHeader: z.string().optional(),
      jwtSecret: z.string().optional(),
      oauthProvider: z.string().optional(),
      basicAuthRealm: z.string().optional(),
      sessionTimeout: z.number().int().min(5).max(1440).optional(), // 5 minutes to 24 hours
      refreshTokenEnabled: z.boolean().optional()
    }).optional()
  }).optional(),
  
  // Advanced configuration schema
  advanced: z.object({
    caching: z.object({
      enabled: z.boolean(),
      strategy: z.enum(['memory', 'redis', 'file', 'database']),
      ttl: z.number().int().min(1).optional(),
      maxSize: z.number().int().min(1).optional(),
      compression: z.boolean().optional(),
      invalidationRules: z.array(z.string()).optional()
    }).optional(),
    
    logging: z.object({
      enabled: z.boolean(),
      level: z.enum(['debug', 'info', 'warn', 'error']),
      destination: z.enum(['console', 'file', 'database', 'external']),
      maxFileSize: z.number().int().min(1).optional(),
      rotationDays: z.number().int().min(1).optional(),
      includeQueryParams: z.boolean().optional(),
      includeHeaders: z.boolean().optional(),
      excludeFields: z.array(z.string()).optional()
    }).optional(),
    
    monitoring: z.object({
      enabled: z.boolean(),
      metricsEndpoint: z.string().url().optional(),
      healthCheckInterval: z.number().int().min(1).optional(),
      performanceThresholds: z.object({
        responseTime: z.number().min(1),
        throughput: z.number().min(1),
        errorRate: z.number().min(0).max(100),
        uptime: z.number().min(0).max(100)
      }).optional()
    }).optional(),
    
    performance: z.object({
      queryOptimization: z.boolean().optional(),
      indexHints: z.boolean().optional(),
      parallelQueries: z.boolean().optional(),
      resultCaching: z.boolean().optional(),
      compressionEnabled: z.boolean().optional(),
      keepAliveTimeout: z.number().int().min(1).optional()
    }).optional(),
    
    backup: z.object({
      enabled: z.boolean(),
      schedule: z.string().optional(), // TODO: Add cron validation
      retentionDays: z.number().int().min(1).optional(),
      compressionEnabled: z.boolean().optional(),
      encryptionEnabled: z.boolean().optional(),
      destination: z.string().optional(),
      notificationOnFailure: z.boolean().optional()
    }).optional(),
    
    maintenance: z.object({
      autoUpdatesEnabled: z.boolean().optional(),
      maintenanceWindow: z.string().optional(),
      notifyBeforeMaintenance: z.boolean().optional(),
      notificationLeadTime: z.number().int().min(1).max(168).optional(), // 1 hour to 1 week
      allowDuringPeakHours: z.boolean().optional()
    }).optional()
  }).optional()
});

/**
 * Service type selection schema for wizard first step
 */
export const ServiceTypeSelectionSchema = z.object({
  type: z.enum([
    'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
    'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
    'apache_hive', 'databricks', 'dremio'
  ]),
  serviceTypeId: z.string().optional()
});

/**
 * Basic service information schema for wizard second step
 */
export const BasicServiceInfoSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'),
  
  label: z.string()
    .min(1, 'Display label is required')
    .max(255, 'Display label must be less than 255 characters'),
  
  description: z.string()
    .max(1024, 'Description must be less than 1024 characters')
    .optional(),
  
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * Connection configuration schema for wizard third step
 */
export const ConnectionConfigSchema = z.object({
  config: ServiceFormSchema.shape.config
});

/**
 * Security configuration schema for wizard fourth step
 */
export const SecurityConfigSchema = z.object({
  security: ServiceFormSchema.shape.security.optional()
});

/**
 * Advanced configuration schema for wizard fifth step
 */
export const AdvancedConfigSchema = z.object({
  advanced: ServiceFormSchema.shape.advanced.optional(),
  requiresPremium: z.boolean().optional(),
  tierAccess: z.enum(['free', 'basic', 'premium', 'enterprise']).optional()
});

/**
 * Inferred types from Zod schemas
 */
export type ServiceFormInput = z.infer<typeof ServiceFormSchema>;
export type ServiceTypeSelectionInput = z.infer<typeof ServiceTypeSelectionSchema>;
export type BasicServiceInfoInput = z.infer<typeof BasicServiceInfoSchema>;
export type ConnectionConfigInput = z.infer<typeof ConnectionConfigSchema>;
export type SecurityConfigInput = z.infer<typeof SecurityConfigSchema>;
export type AdvancedConfigInput = z.infer<typeof AdvancedConfigSchema>;

// =============================================================================
// DYNAMIC FIELD CONFIGURATION
// =============================================================================

/**
 * Dynamic field configuration for service-specific forms
 */
export interface DynamicFieldConfig {
  id: string;
  name: string;
  type: DynamicFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  
  // Field validation
  validation?: DynamicFieldValidation;
  
  // Conditional logic
  conditional?: ConditionalLogic;
  
  // Field-specific options
  options?: SelectOption[];
  multiselect?: boolean;
  searchable?: boolean;
  creatable?: boolean;
  
  // Formatting and masks
  mask?: string;
  transform?: FieldTransform;
  
  // Layout configuration
  width?: FieldWidth;
  order?: number;
  section?: string;
  grid?: GridConfig;
  
  // Default values
  defaultValue?: any;
  computedDefault?: (formData: any) => any;
  
  // Dependencies
  dependsOn?: string[];
  affects?: string[];
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * Supported dynamic field types for database service configuration
 */
export type DynamicFieldType = 
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'number'
  | 'range'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'textarea'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'color'
  | 'json'
  | 'code'
  | 'tags'
  | 'key-value'
  | 'array'
  | 'object'
  | 'connection-test'
  | 'port-scanner'
  | 'certificate-upload';

/**
 * Field validation configuration
 */
export interface DynamicFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: (value: any, formData: any) => string | undefined;
  asyncValidator?: (value: any, formData: any) => Promise<string | undefined>;
  debounceMs?: number;
}

/**
 * Conditional logic for dynamic field display and behavior
 */
export interface ConditionalLogic {
  conditions: FieldCondition[];
  operator: 'AND' | 'OR';
  action: ConditionalAction;
  targetValue?: any;
}

/**
 * Individual condition for conditional logic
 */
export interface FieldCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  caseSensitive?: boolean;
}

/**
 * Comparison operators for field conditions
 */
export type ComparisonOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull'
  | 'oneOf'
  | 'noneOf';

/**
 * Actions for conditional logic
 */
export type ConditionalAction = 
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'focus'
  | 'clear'
  | 'setValue'
  | 'addValidation'
  | 'removeValidation';

/**
 * Field transformation options
 */
export type FieldTransform = 
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'trim'
  | 'slugify'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase';

/**
 * Field width configuration for responsive layouts
 */
export type FieldWidth = 
  | 'full'
  | 'half'
  | 'third'
  | 'quarter'
  | 'auto'
  | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };

/**
 * Grid configuration for field layout
 */
export interface GridConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  offset?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * Select option configuration for dropdown and radio fields
 */
export interface SelectOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// PAYWALL INTEGRATION TYPES
// =============================================================================

/**
 * Paywall modal state and configuration
 */
export interface PaywallModalState {
  isOpen: boolean;
  serviceType?: DatabaseDriver;
  featureName?: string;
  requiredTier: ServiceTierAccess;
  currentTier: ServiceTierAccess;
  upgradeUrl?: string;
  contactSalesUrl?: string;
  trialAvailable?: boolean;
  trialDaysRemaining?: number;
}

/**
 * Paywall feature access configuration
 */
export interface PaywallFeatureAccess {
  id: string;
  name: string;
  description: string;
  requiredTier: ServiceTierAccess;
  isAvailable: boolean;
  reason?: string;
  upgradePrompt?: string;
  documentationUrl?: string;
  contactSalesPrompt?: string;
}

/**
 * Premium service access configuration
 */
export interface PremiumServiceConfig {
  serviceType: DatabaseDriver;
  tierRequired: ServiceTierAccess;
  features: string[];
  limitations?: ServiceLimitation[];
  trialPeriod?: number; // in days
  upgradeIncentives?: UpgradeIncentive[];
}

/**
 * Service limitation configuration for different tiers
 */
export interface ServiceLimitation {
  feature: string;
  limitation: string;
  maxValue?: number;
  unit?: string;
  tier: ServiceTierAccess;
}

/**
 * Upgrade incentive configuration for premium features
 */
export interface UpgradeIncentive {
  title: string;
  description: string;
  value: string;
  highlight?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

// =============================================================================
// REACT COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Service Form Container component props
 */
export interface ServiceFormContainerProps extends BaseComponentProps {
  mode: ServiceFormMode;
  serviceId?: number;
  serviceName?: string;
  initialData?: Partial<ServiceFormData>;
  onSubmit?: (data: ServiceFormInput) => void | Promise<void>;
  onCancel?: () => void;
  onNavigate?: (route: string) => void;
  redirectOnSuccess?: string;
  redirectOnCancel?: string;
  enablePaywall?: boolean;
  customValidation?: (data: ServiceFormInput) => Promise<Record<string, string> | undefined>;
}

/**
 * Service Form Wizard component props
 */
export interface ServiceFormWizardProps extends BaseComponentProps {
  steps: WizardStep[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onSubmit?: (data: ServiceFormInput) => void | Promise<void>;
  onCancel?: () => void;
  enableStepValidation?: boolean;
  allowSkipOptionalSteps?: boolean;
  showProgress?: boolean;
  showStepIndicator?: boolean;
  navigationStyle?: 'buttons' | 'stepper' | 'tabs' | 'sidebar';
  submitButtonText?: string;
  cancelButtonText?: string;
  previousButtonText?: string;
  nextButtonText?: string;
  customValidation?: Record<string, (data: any) => Promise<Record<string, string> | undefined>>;
}

/**
 * Service Form Fields component props for dynamic field rendering
 */
export interface ServiceFormFieldsProps extends BaseComponentProps {
  fields: DynamicFieldConfig[];
  control: Control<any>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  trigger: UseFormTrigger<any>;
  errors: Record<string, FieldError>;
  isSubmitting?: boolean;
  section?: string;
  layout?: 'single' | 'two-column' | 'grid';
  showFieldGroups?: boolean;
  enableConditionalLogic?: boolean;
  enableAsyncValidation?: boolean;
  onFieldChange?: (fieldName: string, value: any) => void;
  onFieldBlur?: (fieldName: string) => void;
  customComponents?: Record<string, ComponentType<any>>;
}

/**
 * Dynamic Field component props for individual field rendering
 */
export interface DynamicFieldProps extends BaseComponentProps {
  config: DynamicFieldConfig;
  control: Control<any>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  trigger: UseFormTrigger<any>;
  error?: FieldError;
  isSubmitting?: boolean;
  formData?: any;
  onFieldChange?: (value: any) => void;
  onFieldBlur?: () => void;
  customComponent?: ComponentType<any>;
}

/**
 * Paywall Modal component props
 */
export interface PaywallModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onContactSales?: () => void;
  onStartTrial?: () => void;
  modalState: PaywallModalState;
  featureAccess?: PaywallFeatureAccess;
  premiumConfig?: PremiumServiceConfig;
  showCalendlyWidget?: boolean;
  calendlyUrl?: string;
  customContent?: ReactNode;
}

/**
 * Service Type Selector component props
 */
export interface ServiceTypeSelectorProps extends BaseComponentProps {
  serviceTypes: ServiceType[];
  selectedType?: DatabaseDriver;
  onTypeSelect: (type: DatabaseDriver, serviceType: ServiceType) => void;
  layout?: 'grid' | 'list' | 'cards';
  showDescriptions?: boolean;
  showIcons?: boolean;
  groupByCategory?: boolean;
  filterByTier?: ServiceTierAccess[];
  enableSearch?: boolean;
  customFilter?: (serviceType: ServiceType) => boolean;
}

/**
 * Connection Test component props
 */
export interface ConnectionTestProps extends BaseComponentProps {
  config: DatabaseConfig;
  onTest?: (config: DatabaseConfig) => void | Promise<void>;
  result?: ConnectionTestResult | null;
  status: ConnectionTestStatus;
  autoTest?: boolean;
  testOnConfigChange?: boolean;
  showDetails?: boolean;
  showMetadata?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
}

/**
 * Service Form Navigation component props
 */
export interface ServiceFormNavigationProps extends BaseComponentProps {
  navigation: WizardNavigationState;
  progress: WizardStepProgress[];
  onPrevious?: () => void;
  onNext?: () => void;
  onStepClick?: (stepIndex: number) => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  showProgress?: boolean;
  showStepLabels?: boolean;
  enableStepClick?: boolean;
  style?: 'horizontal' | 'vertical' | 'minimal';
  previousButtonText?: string;
  nextButtonText?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
}

// =============================================================================
// FORM HOOK INTERFACES
// =============================================================================

/**
 * Service Form hook return type
 */
export interface UseServiceFormReturn extends UseFormReturn<ServiceFormInput> {
  submitForm: (onSuccess?: (data: ServiceFormInput) => void) => Promise<void>;
  resetForm: (data?: Partial<ServiceFormInput>) => void;
  validateForm: () => Promise<boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Record<string, FieldError>;
  touchedFields: Record<string, boolean>;
  dirtyFields: Record<string, boolean>;
}

/**
 * Service Form Wizard hook return type
 */
export interface UseServiceFormWizardReturn {
  // Current state
  currentStep: number;
  navigation: WizardNavigationState;
  progress: WizardStepProgress[];
  
  // Navigation methods
  goToStep: (stepIndex: number) => Promise<boolean>;
  goToNextStep: () => Promise<boolean>;
  goToPreviousStep: () => void;
  goToFirstStep: () => void;
  goToLastStep: () => void;
  
  // Validation methods
  validateCurrentStep: () => Promise<boolean>;
  validateAllSteps: () => Promise<boolean>;
  validateStep: (stepIndex: number) => Promise<boolean>;
  
  // Step management
  completeStep: (stepIndex: number) => void;
  skipStep: (stepIndex: number) => void;
  resetStep: (stepIndex: number) => void;
  
  // Data management
  getStepData: (stepIndex: number) => any;
  setStepData: (stepIndex: number, data: any) => void;
  getAllData: () => ServiceFormInput;
  resetAllData: () => void;
  
  // Submission
  submitWizard: () => Promise<void>;
  
  // State flags
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isCompleted: boolean;
}

/**
 * Connection Test hook return type
 */
export interface UseConnectionTestReturn {
  testConnection: (config?: DatabaseConfig) => Promise<void>;
  result: ConnectionTestResult | null;
  status: ConnectionTestStatus;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  lastTested: string | null;
  retryCount: number;
  resetTest: () => void;
  retryTest: () => Promise<void>;
}

/**
 * Paywall Access hook return type
 */
export interface UsePaywallAccessReturn {
  // Access checking
  checkFeatureAccess: (feature: string) => PaywallFeatureAccess;
  checkServiceAccess: (serviceType: DatabaseDriver) => boolean;
  isFeatureAvailable: (feature: string) => boolean;
  
  // Modal management
  modalState: PaywallModalState;
  openPaywallModal: (config: Partial<PaywallModalState>) => void;
  closePaywallModal: () => void;
  
  // Tier management
  currentTier: ServiceTierAccess;
  upgradeToTier: (tier: ServiceTierAccess) => Promise<void>;
  startTrial: (serviceType: DatabaseDriver) => Promise<void>;
  
  // Premium configuration
  getPremiumConfig: (serviceType: DatabaseDriver) => PremiumServiceConfig | null;
  getUpgradeUrl: (tier: ServiceTierAccess) => string;
  getContactSalesUrl: (serviceType: DatabaseDriver) => string;
}

/**
 * Dynamic Fields hook return type
 */
export interface UseDynamicFieldsReturn {
  // Field configuration
  fields: DynamicFieldConfig[];
  getFieldConfig: (fieldName: string) => DynamicFieldConfig | undefined;
  updateFieldConfig: (fieldName: string, config: Partial<DynamicFieldConfig>) => void;
  
  // Field visibility and state
  getFieldVisibility: (fieldName: string) => boolean;
  getFieldDisabled: (fieldName: string) => boolean;
  getFieldRequired: (fieldName: string) => boolean;
  
  // Conditional logic
  evaluateConditions: (fieldName: string) => boolean;
  applyConditionalLogic: () => void;
  
  // Field dependencies
  getDependentFields: (fieldName: string) => string[];
  getFieldDependencies: (fieldName: string) => string[];
  refreshDependentFields: (fieldName: string) => void;
  
  // Validation
  validateField: (fieldName: string, value: any) => Promise<string | undefined>;
  validateAllFields: () => Promise<Record<string, string>>;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Wizard step key mapping for type safety
 */
export const WIZARD_STEPS = {
  SERVICE_TYPE: 'service-type',
  BASIC_INFO: 'basic-info',
  CONNECTION_CONFIG: 'connection-config',
  SECURITY_CONFIG: 'security-config',
  ADVANCED_CONFIG: 'advanced-config',
  REVIEW: 'review'
} as const;

export type WizardStepKey = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS];

/**
 * Default wizard steps configuration
 */
export const DEFAULT_WIZARD_STEPS: WizardStep[] = [
  {
    id: WIZARD_STEPS.SERVICE_TYPE,
    title: 'Select Service Type',
    description: 'Choose the database type for your new service',
    fields: ['type', 'serviceTypeId'],
    validationSchema: ServiceTypeSelectionSchema,
    estimatedDuration: 2
  },
  {
    id: WIZARD_STEPS.BASIC_INFO,
    title: 'Basic Information',
    description: 'Configure basic service details and metadata',
    fields: ['name', 'label', 'description', 'category', 'tags'],
    validationSchema: BasicServiceInfoSchema,
    estimatedDuration: 3
  },
  {
    id: WIZARD_STEPS.CONNECTION_CONFIG,
    title: 'Connection Configuration',
    description: 'Set up database connection parameters',
    fields: ['config'],
    validationSchema: ConnectionConfigSchema,
    estimatedDuration: 5
  },
  {
    id: WIZARD_STEPS.SECURITY_CONFIG,
    title: 'Security Configuration',
    description: 'Configure access control and security settings',
    fields: ['security'],
    validationSchema: SecurityConfigSchema,
    optional: true,
    estimatedDuration: 4
  },
  {
    id: WIZARD_STEPS.ADVANCED_CONFIG,
    title: 'Advanced Configuration',
    description: 'Configure advanced options and premium features',
    fields: ['advanced', 'requiresPremium', 'tierAccess'],
    validationSchema: AdvancedConfigSchema,
    optional: true,
    estimatedDuration: 6
  }
];

/**
 * Form field validation error types
 */
export interface FormFieldError extends FieldError {
  field: string;
  code?: string;
  context?: Record<string, any>;
}

/**
 * Service form submission result
 */
export interface ServiceFormSubmissionResult {
  success: boolean;
  service?: DatabaseService;
  errors?: FormFieldError[];
  warnings?: string[];
  redirectUrl?: string;
  nextSteps?: string[];
}

/**
 * Service form analytics event data
 */
export interface ServiceFormAnalyticsEvent {
  event: 'form_started' | 'step_completed' | 'form_submitted' | 'form_abandoned' | 'error_occurred';
  serviceType?: DatabaseDriver;
  step?: string;
  duration?: number;
  errors?: string[];
  metadata?: Record<string, any>;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used types from base types
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
} from '../types';

// Export all schemas
export {
  ServiceFormSchema,
  ServiceTypeSelectionSchema,
  BasicServiceInfoSchema,
  ConnectionConfigSchema,
  SecurityConfigSchema,
  AdvancedConfigSchema
};

// Export inferred types
export type {
  ServiceFormInput,
  ServiceTypeSelectionInput,
  BasicServiceInfoInput,
  ConnectionConfigInput,
  SecurityConfigInput,
  AdvancedConfigInput
};

// Export constants
export {
  WIZARD_STEPS,
  DEFAULT_WIZARD_STEPS
};