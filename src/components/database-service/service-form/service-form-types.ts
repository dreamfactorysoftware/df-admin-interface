/**
 * Database Service Form Types
 * 
 * TypeScript interface definitions, type exports, and Zod schema validators 
 * specific to database service form components. Defines type-safe contracts 
 * for service form operations, wizard steps, dynamic field configurations, 
 * paywall states, and form validation schemas. Provides comprehensive type 
 * safety for React Hook Form integration and service configuration workflows.
 * 
 * @fileoverview Database service form types for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { z } from 'zod';
import type { ReactNode, ComponentType, FormEvent, RefObject } from 'react';
import type { 
  UseFormReturn, 
  FieldError, 
  FieldErrors,
  Path, 
  PathValue,
  UseFormSetError,
  UseFormClearErrors,
  UseFormWatch,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
  Control,
  FieldValues,
  DefaultValues,
  SubmitHandler,
  SubmitErrorHandler,
} from 'react-hook-form';

// Import base types and schemas
import type {
  DatabaseDriver,
  ServiceStatus,
  DatabaseService,
  DatabaseConnectionFormData,
  ConnectionTestResult,
  DatabaseConnectionSchema,
  ConnectionTestFormData,
  BaseComponentProps,
  ConnectionTestProps,
  ValidationMode,
} from '../types';

import type {
  FormFieldType,
  FormField,
  FormSchema,
  ConditionalLogic,
  FieldFormatting,
  GridConfig,
  FormValidation,
  FormLayout,
  LayoutType,
  SpacingSize,
} from '../../../types/form-schema';

// =============================================================================
// ENHANCED ZOD SCHEMA VALIDATORS FOR SERVICE FORMS
// =============================================================================

/**
 * Service form wizard step schema for multi-step validation
 */
export const ServiceFormStepSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  stepName: z.string().min(1, 'Step name is required'),
  isValid: z.boolean(),
  isComplete: z.boolean(),
  data: z.record(z.any()).optional(),
  errors: z.record(z.string()).optional(),
});

/**
 * Service form wizard navigation schema
 */
export const ServiceFormWizardNavigationSchema = z.object({
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
  canGoNext: z.boolean(),
  canGoPrevious: z.boolean(),
  canFinish: z.boolean(),
  steps: z.array(ServiceFormStepSchema),
});

/**
 * Service type selection schema with enhanced validation
 */
export const ServiceTypeSelectionSchema = z.object({
  selectedType: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite'], {
    required_error: 'Database type selection is required',
    invalid_type_error: 'Invalid database type selected',
  }),
  typeMetadata: z.object({
    displayName: z.string(),
    description: z.string(),
    defaultPort: z.number().optional(),
    supportsSSL: z.boolean(),
    supportsPooling: z.boolean(),
    requiredFields: z.array(z.string()),
    optionalFields: z.array(z.string()),
    helpUrl: z.string().url().optional(),
  }).optional(),
});

/**
 * Enhanced database connection schema with wizard-specific validation
 */
export const WizardDatabaseConnectionSchema = DatabaseConnectionSchema.extend({
  // Wizard-specific fields
  stepData: z.record(z.any()).optional(),
  skipValidation: z.boolean().default(false),
  saveAsDraft: z.boolean().default(false),
  
  // Enhanced validation for wizard context
  connectionValidated: z.boolean().default(false),
  schemaDiscovered: z.boolean().default(false),
  securityConfigured: z.boolean().default(false),
  
  // Wizard flow control
  allowIncompleteSubmission: z.boolean().default(false),
  forceRevalidation: z.boolean().default(false),
});

/**
 * Paywall configuration schema for premium features
 */
export const PaywallConfigurationSchema = z.object({
  feature: z.string().min(1, 'Feature identifier is required'),
  tier: z.enum(['free', 'premium', 'enterprise'], {
    required_error: 'Service tier is required',
  }),
  isBlocked: z.boolean(),
  blockReason: z.string().optional(),
  upgradeUrl: z.string().url().optional(),
  trialAvailable: z.boolean().default(false),
  trialDaysRemaining: z.number().int().min(0).optional(),
  featureDescription: z.string().optional(),
  limitationMessage: z.string().optional(),
});

/**
 * Security configuration schema for service setup
 */
export const SecurityConfigurationSchema = z.object({
  accessType: z.enum(['public', 'private', 'restricted'], {
    required_error: 'Access type is required',
  }),
  requireApiKey: z.boolean().default(true),
  allowedOrigins: z.array(z.string().url()).optional(),
  allowedIPs: z.array(z.string().ip()).optional(),
  rateLimiting: z.object({
    enabled: z.boolean().default(false),
    requestsPerMinute: z.number().int().min(1).max(10000).optional(),
    requestsPerHour: z.number().int().min(1).max(100000).optional(),
    requestsPerDay: z.number().int().min(1).max(1000000).optional(),
  }).optional(),
  roles: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    permissions: z.array(z.string()),
  })).optional(),
  customHeaders: z.record(z.string()).optional(),
});

/**
 * Service form configuration schema
 */
export const ServiceFormConfigurationSchema = z.object({
  mode: z.enum(['create', 'edit', 'clone', 'view']),
  initialData: WizardDatabaseConnectionSchema.partial().optional(),
  serviceId: z.number().int().positive().optional(),
  
  // Form behavior
  enableWizard: z.boolean().default(true),
  enableAutoSave: z.boolean().default(false),
  autoSaveInterval: z.number().int().min(1000).max(60000).default(5000),
  
  // Validation settings
  enableRealTimeValidation: z.boolean().default(true),
  validationMode: z.enum(['onSubmit', 'onBlur', 'onChange', 'onTouched']).default('onChange'),
  reValidateMode: z.enum(['onSubmit', 'onBlur', 'onChange', 'onTouched']).default('onChange'),
  
  // Feature toggles
  enableConnectionTest: z.boolean().default(true),
  enableSchemaDiscovery: z.boolean().default(true),
  enableSecurityConfiguration: z.boolean().default(true),
  enablePaywallChecks: z.boolean().default(true),
  
  // UI customization
  layout: z.enum(['vertical', 'horizontal', 'wizard']).default('wizard'),
  theme: z.enum(['default', 'compact', 'comfortable']).default('default'),
  showProgress: z.boolean().default(true),
  showHelpText: z.boolean().default(true),
});

/**
 * Inferred types from enhanced Zod schemas
 */
export type ServiceFormStepData = z.infer<typeof ServiceFormStepSchema>;
export type ServiceFormWizardNavigation = z.infer<typeof ServiceFormWizardNavigationSchema>;
export type ServiceTypeSelection = z.infer<typeof ServiceTypeSelectionSchema>;
export type WizardDatabaseConnectionFormData = z.infer<typeof WizardDatabaseConnectionSchema>;
export type PaywallConfiguration = z.infer<typeof PaywallConfigurationSchema>;
export type SecurityConfiguration = z.infer<typeof SecurityConfigurationSchema>;
export type ServiceFormConfiguration = z.infer<typeof ServiceFormConfigurationSchema>;

// =============================================================================
// REACT COMPONENT PROP INTERFACES FOR SERVICE FORMS
// =============================================================================

/**
 * Service Form Wizard Component Props
 * Multi-step wizard for database service configuration
 */
export interface ServiceFormWizardProps extends BaseComponentProps {
  /** Wizard configuration */
  config: ServiceFormConfiguration;
  
  /** Initial form data */
  initialData?: Partial<WizardDatabaseConnectionFormData>;
  
  /** Form submission callback */
  onSubmit: SubmitHandler<WizardDatabaseConnectionFormData>;
  
  /** Form cancellation callback */
  onCancel?: () => void;
  
  /** Step change callback */
  onStepChange?: (stepIndex: number, stepData: ServiceFormStepData) => void;
  
  /** Form validation callback */
  onValidationChange?: (isValid: boolean, errors: FieldErrors<WizardDatabaseConnectionFormData>) => void;
  
  /** Auto-save callback */
  onAutoSave?: (data: Partial<WizardDatabaseConnectionFormData>) => void;
  
  /** Connection test callback */
  onConnectionTest?: (data: WizardDatabaseConnectionFormData) => Promise<ConnectionTestResult>;
  
  /** Schema discovery callback */
  onSchemaDiscovery?: (data: WizardDatabaseConnectionFormData) => Promise<void>;
  
  /** Security configuration callback */
  onSecurityConfiguration?: (securityConfig: SecurityConfiguration) => Promise<void>;
  
  /** Paywall check callback */
  onPaywallCheck?: (feature: string) => Promise<PaywallConfiguration>;
  
  /** Custom wizard steps */
  customSteps?: WizardStepDefinition[];
  
  /** Step validation overrides */
  stepValidation?: Record<string, (data: any) => Promise<boolean>>;
  
  /** Loading states for async operations */
  loadingStates?: {
    submitting?: boolean;
    testing?: boolean;
    discovering?: boolean;
    validating?: boolean;
  };
  
  /** Error states */
  errors?: {
    submission?: string;
    connection?: string;
    discovery?: string;
    validation?: string;
  };
  
  /** Feature flags */
  features?: {
    enableAdvancedOptions?: boolean;
    enableBulkOperations?: boolean;
    enableTemplates?: boolean;
    enableImportExport?: boolean;
  };
  
  /** Accessibility options */
  accessibility?: {
    announceStepChanges?: boolean;
    highContrast?: boolean;
    reducedMotion?: boolean;
    screenReaderOptimized?: boolean;
  };
  
  /** Debug mode */
  debug?: boolean;
}

/**
 * Service Form Container Component Props
 * Container wrapper for service form components
 */
export interface ServiceFormContainerProps extends BaseComponentProps {
  /** Form mode */
  mode: 'create' | 'edit' | 'clone' | 'view';
  
  /** Service ID for edit/view modes */
  serviceId?: number;
  
  /** Initial service data */
  initialService?: DatabaseService;
  
  /** Form submission callback */
  onSubmit: (data: WizardDatabaseConnectionFormData) => Promise<void>;
  
  /** Navigation callbacks */
  onCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  
  /** Container layout */
  layout?: 'wizard' | 'tabbed' | 'accordion' | 'single-page';
  
  /** Show navigation */
  showNavigation?: boolean;
  
  /** Show progress indicator */
  showProgress?: boolean;
  
  /** Show form actions */
  showActions?: boolean;
  
  /** Custom action buttons */
  customActions?: ReactNode;
  
  /** Container loading state */
  loading?: boolean;
  
  /** Container error state */
  error?: string | null;
  
  /** Enable form persistence */
  enablePersistence?: boolean;
  
  /** Persistence key */
  persistenceKey?: string;
  
  /** Form state change callback */
  onStateChange?: (state: ServiceFormState) => void;
  
  /** Form validation callback */
  onValidation?: (isValid: boolean, errors: FieldErrors<WizardDatabaseConnectionFormData>) => void;
  
  /** Custom form renderer */
  formRenderer?: ComponentType<ServiceFormWizardProps>;
  
  /** Custom header content */
  headerContent?: ReactNode;
  
  /** Custom footer content */
  footerContent?: ReactNode;
  
  /** Custom sidebar content */
  sidebarContent?: ReactNode;
  
  /** Container variant */
  variant?: 'default' | 'compact' | 'full-screen' | 'modal';
  
  /** Enable keyboard navigation */
  enableKeyboardNav?: boolean;
  
  /** Custom CSS classes */
  containerClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

/**
 * Dynamic Field Component Props
 * Configurable field component for service forms
 */
export interface DynamicFieldProps extends BaseComponentProps {
  /** Field configuration */
  field: FormField;
  
  /** Form control instance */
  control: Control<WizardDatabaseConnectionFormData>;
  
  /** Field value */
  value?: any;
  
  /** Field change callback */
  onChange?: (value: any) => void;
  
  /** Field validation callback */
  onValidation?: (isValid: boolean, error?: string) => void;
  
  /** Field error */
  error?: FieldError;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is readonly */
  readonly?: boolean;
  
  /** Field is hidden */
  hidden?: boolean;
  
  /** Show field validation state */
  showValidationState?: boolean;
  
  /** Enable real-time validation */
  enableRealTimeValidation?: boolean;
  
  /** Validation debounce delay */
  validationDelay?: number;
  
  /** Custom field renderer */
  renderer?: ComponentType<FieldRendererProps>;
  
  /** Field context */
  context?: FieldContext;
  
  /** Field dependencies */
  dependencies?: FieldDependency[];
  
  /** Custom validation rules */
  customValidation?: FieldValidationRule[];
  
  /** Field formatting options */
  formatting?: FieldFormatting;
  
  /** Field grid configuration */
  grid?: GridConfig;
  
  /** Field conditional logic */
  conditional?: ConditionalLogic;
  
  /** Field help content */
  helpContent?: ReactNode;
  
  /** Field accessibility options */
  accessibility?: FieldAccessibilityOptions;
}

/**
 * Service Form State Management
 */
export interface ServiceFormState {
  /** Current wizard step */
  currentStep: number;
  
  /** Form data */
  data: Partial<WizardDatabaseConnectionFormData>;
  
  /** Form validation state */
  isValid: boolean;
  
  /** Form dirty state */
  isDirty: boolean;
  
  /** Form submission state */
  isSubmitting: boolean;
  
  /** Form errors */
  errors: FieldErrors<WizardDatabaseConnectionFormData>;
  
  /** Step completion status */
  stepStates: Record<number, ServiceFormStepData>;
  
  /** Connection test results */
  connectionTestResult?: ConnectionTestResult;
  
  /** Schema discovery state */
  schemaDiscoveryState?: {
    isDiscovering: boolean;
    discoveredTables: number;
    totalTables: number;
    errors: string[];
  };
  
  /** Security configuration state */
  securityConfiguration?: SecurityConfiguration;
  
  /** Paywall states */
  paywallStates: Record<string, PaywallConfiguration>;
  
  /** Auto-save state */
  autoSaveState?: {
    enabled: boolean;
    lastSaved: number;
    isDirty: boolean;
    error?: string;
  };
  
  /** Form history for undo/redo */
  history?: {
    undoStack: Partial<WizardDatabaseConnectionFormData>[];
    redoStack: Partial<WizardDatabaseConnectionFormData>[];
    canUndo: boolean;
    canRedo: boolean;
  };
}

/**
 * Wizard Step Definition
 */
export interface WizardStepDefinition {
  /** Step identifier */
  id: string;
  
  /** Step display name */
  name: string;
  
  /** Step description */
  description?: string;
  
  /** Step icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Step component */
  component: ComponentType<WizardStepProps>;
  
  /** Step validation function */
  validate?: (data: Partial<WizardDatabaseConnectionFormData>) => Promise<boolean>;
  
  /** Step can be skipped */
  optional?: boolean;
  
  /** Step requires previous steps to be complete */
  requiresPrevious?: boolean;
  
  /** Step dependencies */
  dependencies?: string[];
  
  /** Step order/index */
  order: number;
  
  /** Step visibility condition */
  visibilityCondition?: (data: Partial<WizardDatabaseConnectionFormData>) => boolean;
  
  /** Step configuration */
  config?: Record<string, any>;
  
  /** Step help content */
  helpContent?: ReactNode;
  
  /** Step accessibility label */
  accessibilityLabel?: string;
}

/**
 * Wizard Step Component Props
 */
export interface WizardStepProps {
  /** Step definition */
  step: WizardStepDefinition;
  
  /** Form data */
  data: Partial<WizardDatabaseConnectionFormData>;
  
  /** Form control */
  control: Control<WizardDatabaseConnectionFormData>;
  
  /** Step validation state */
  isValid: boolean;
  
  /** Step errors */
  errors: FieldErrors<WizardDatabaseConnectionFormData>;
  
  /** Data change callback */
  onDataChange: (updates: Partial<WizardDatabaseConnectionFormData>) => void;
  
  /** Validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Step completion callback */
  onComplete: () => void;
  
  /** Navigation callbacks */
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  
  /** Step context */
  context?: StepContext;
  
  /** Loading states */
  loading?: boolean;
  
  /** Read-only mode */
  readonly?: boolean;
  
  /** Debug mode */
  debug?: boolean;
}

/**
 * Field Renderer Component Props
 */
export interface FieldRendererProps {
  /** Field configuration */
  field: FormField;
  
  /** Field value */
  value: any;
  
  /** Field change callback */
  onChange: (value: any) => void;
  
  /** Field blur callback */
  onBlur: () => void;
  
  /** Field focus callback */
  onFocus: () => void;
  
  /** Field error */
  error?: string;
  
  /** Field validation state */
  isValid?: boolean;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is readonly */
  readonly?: boolean;
  
  /** Field ref */
  ref?: RefObject<any>;
  
  /** Additional props */
  [key: string]: any;
}

/**
 * Field Context Information
 */
export interface FieldContext {
  /** Parent form name */
  formName: string;
  
  /** Field path in form */
  fieldPath: string;
  
  /** Related fields */
  relatedFields: string[];
  
  /** Field group */
  group?: string;
  
  /** Field section */
  section?: string;
  
  /** Form mode */
  mode: 'create' | 'edit' | 'clone' | 'view';
  
  /** Service type context */
  serviceType?: DatabaseDriver;
  
  /** Feature flags */
  features: Record<string, boolean>;
  
  /** User permissions */
  permissions: string[];
  
  /** Localization */
  locale: string;
  
  /** Theme */
  theme: string;
}

/**
 * Field Dependency Configuration
 */
export interface FieldDependency {
  /** Dependent field name */
  field: string;
  
  /** Dependency type */
  type: 'value' | 'visibility' | 'enabled' | 'required' | 'options';
  
  /** Dependency condition */
  condition: (value: any, allValues: Partial<WizardDatabaseConnectionFormData>) => boolean;
  
  /** Dependency action */
  action: (dependentValue: any, currentValue: any) => any;
}

/**
 * Field Validation Rule
 */
export interface FieldValidationRule {
  /** Rule name */
  name: string;
  
  /** Validation function */
  validate: (value: any, allValues: Partial<WizardDatabaseConnectionFormData>) => boolean | string;
  
  /** Error message */
  message: string;
  
  /** Rule priority */
  priority?: number;
  
  /** Rule applies to field types */
  fieldTypes?: FormFieldType[];
  
  /** Rule conditions */
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

/**
 * Field Accessibility Options
 */
export interface FieldAccessibilityOptions {
  /** ARIA label */
  ariaLabel?: string;
  
  /** ARIA described by */
  ariaDescribedBy?: string;
  
  /** ARIA required */
  ariaRequired?: boolean;
  
  /** ARIA invalid */
  ariaInvalid?: boolean;
  
  /** Tab index */
  tabIndex?: number;
  
  /** Skip to next field key */
  skipToNextKey?: string;
  
  /** Screen reader text */
  screenReaderText?: string;
  
  /** High contrast mode */
  highContrast?: boolean;
  
  /** Focus management */
  focusManagement?: {
    autoFocus?: boolean;
    focusOnError?: boolean;
    focusOnSuccess?: boolean;
  };
}

/**
 * Step Context Information
 */
export interface StepContext {
  /** Current step index */
  stepIndex: number;
  
  /** Total steps */
  totalSteps: number;
  
  /** Step progress percentage */
  progress: number;
  
  /** Previous step data */
  previousStepData?: Partial<WizardDatabaseConnectionFormData>;
  
  /** Navigation history */
  navigationHistory: number[];
  
  /** Step timing */
  timing: {
    startTime: number;
    currentTime: number;
    timeSpent: number;
  };
  
  /** Step analytics */
  analytics?: {
    interactions: number;
    validationAttempts: number;
    helpViewed: boolean;
    completed: boolean;
  };
}

// =============================================================================
// PAYWALL INTEGRATION TYPES
// =============================================================================

/**
 * Paywall State Management
 */
export interface PaywallState {
  /** Feature identifier */
  feature: string;
  
  /** User's current tier */
  userTier: 'free' | 'premium' | 'enterprise';
  
  /** Feature is blocked */
  isBlocked: boolean;
  
  /** Block reason */
  reason?: string;
  
  /** Upgrade options */
  upgradeOptions?: PaywallUpgradeOption[];
  
  /** Trial status */
  trial?: {
    available: boolean;
    daysRemaining: number;
    isActive: boolean;
  };
  
  /** Usage limits */
  limits?: {
    current: number;
    maximum: number;
    resetDate?: string;
  };
}

/**
 * Paywall Upgrade Option
 */
export interface PaywallUpgradeOption {
  /** Tier name */
  tier: 'premium' | 'enterprise';
  
  /** Tier display name */
  displayName: string;
  
  /** Tier description */
  description: string;
  
  /** Pricing information */
  pricing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    discountPercentage?: number;
  };
  
  /** Features included */
  features: string[];
  
  /** Upgrade URL */
  upgradeUrl: string;
  
  /** CTA text */
  ctaText: string;
  
  /** Recommended option */
  recommended?: boolean;
}

/**
 * Paywall Component Props
 */
export interface PaywallComponentProps extends BaseComponentProps {
  /** Paywall state */
  state: PaywallState;
  
  /** Feature being accessed */
  feature: string;
  
  /** Blocking mode */
  mode: 'soft-block' | 'hard-block' | 'overlay' | 'inline';
  
  /** Custom blocked content */
  blockedContent?: ReactNode;
  
  /** Custom upgrade prompt */
  upgradePrompt?: ReactNode;
  
  /** Upgrade callback */
  onUpgrade?: (tier: string) => void;
  
  /** Trial start callback */
  onStartTrial?: () => void;
  
  /** Dismiss callback */
  onDismiss?: () => void;
  
  /** Analytics callback */
  onAnalytics?: (event: string, data: Record<string, any>) => void;
  
  /** Show trial option */
  showTrial?: boolean;
  
  /** Show usage limits */
  showLimits?: boolean;
  
  /** Custom styling */
  styling?: {
    variant?: 'default' | 'minimal' | 'card' | 'banner';
    size?: 'sm' | 'md' | 'lg';
    theme?: 'light' | 'dark' | 'auto';
  };
}

// =============================================================================
// CONNECTION TESTING INTEGRATION TYPES
// =============================================================================

/**
 * Enhanced Connection Test Props for Form Integration
 */
export interface FormConnectionTestProps extends Omit<ConnectionTestProps, 'config'> {
  /** Form data for testing */
  formData: Partial<WizardDatabaseConnectionFormData>;
  
  /** Form control for field validation */
  control: Control<WizardDatabaseConnectionFormData>;
  
  /** Test on form change */
  testOnChange?: boolean;
  
  /** Fields to watch for auto-testing */
  watchFields?: Array<Path<WizardDatabaseConnectionFormData>>;
  
  /** Validation requirements before testing */
  requireValid?: Array<Path<WizardDatabaseConnectionFormData>>;
  
  /** Form validation callback */
  onFormValidation?: (isValid: boolean) => void;
  
  /** Test progress callback */
  onProgress?: (progress: ConnectionTestProgress) => void;
  
  /** Advanced test options */
  advancedOptions?: ConnectionTestAdvancedOptions;
}

/**
 * Connection Test Progress Information
 */
export interface ConnectionTestProgress {
  /** Current test phase */
  phase: 'validating' | 'connecting' | 'authenticating' | 'querying' | 'cleanup';
  
  /** Progress percentage */
  percentage: number;
  
  /** Current step description */
  description: string;
  
  /** Elapsed time */
  elapsedTime: number;
  
  /** Estimated remaining time */
  estimatedRemaining?: number;
  
  /** Test warnings */
  warnings: string[];
}

/**
 * Advanced Connection Test Options
 */
export interface ConnectionTestAdvancedOptions {
  /** Test query to execute */
  testQuery?: string;
  
  /** Connection timeout */
  connectionTimeout?: number;
  
  /** Query timeout */
  queryTimeout?: number;
  
  /** SSL verification mode */
  sslVerification?: 'strict' | 'lax' | 'disabled';
  
  /** Test database features */
  testFeatures?: {
    testTables?: boolean;
    testViews?: boolean;
    testProcedures?: boolean;
    testPermissions?: boolean;
  };
  
  /** Performance testing */
  performanceTest?: {
    enabled: boolean;
    iterations?: number;
    measureLatency?: boolean;
    measureThroughput?: boolean;
  };
  
  /** Connection pool testing */
  poolTest?: {
    enabled: boolean;
    maxConnections?: number;
    testConcurrency?: boolean;
  };
}

// =============================================================================
// FORM UTILITIES AND HELPERS
// =============================================================================

/**
 * Form Utility Functions Interface
 */
export interface ServiceFormUtils {
  /** Validate single field */
  validateField: (
    fieldName: Path<WizardDatabaseConnectionFormData>,
    value: any,
    allValues: Partial<WizardDatabaseConnectionFormData>
  ) => Promise<boolean | string>;
  
  /** Validate all fields */
  validateAllFields: (
    data: Partial<WizardDatabaseConnectionFormData>
  ) => Promise<FieldErrors<WizardDatabaseConnectionFormData>>;
  
  /** Transform form data for submission */
  transformForSubmission: (
    data: WizardDatabaseConnectionFormData
  ) => DatabaseConnectionFormData;
  
  /** Transform service data for form */
  transformFromService: (
    service: DatabaseService
  ) => Partial<WizardDatabaseConnectionFormData>;
  
  /** Get default values for service type */
  getDefaultValues: (
    type: DatabaseDriver
  ) => Partial<WizardDatabaseConnectionFormData>;
  
  /** Format field value for display */
  formatFieldValue: (
    fieldName: string,
    value: any,
    formatting?: FieldFormatting
  ) => string;
  
  /** Parse field value from input */
  parseFieldValue: (
    fieldName: string,
    value: string,
    fieldType: FormFieldType
  ) => any;
  
  /** Get field dependencies */
  getFieldDependencies: (
    fieldName: string,
    serviceType: DatabaseDriver
  ) => FieldDependency[];
  
  /** Check field visibility */
  isFieldVisible: (
    fieldName: string,
    data: Partial<WizardDatabaseConnectionFormData>,
    conditionalLogic?: ConditionalLogic
  ) => boolean;
  
  /** Generate field validation schema */
  generateFieldSchema: (
    field: FormField,
    serviceType?: DatabaseDriver
  ) => z.ZodSchema<any>;
}

/**
 * Form Configuration Factory
 */
export interface ServiceFormConfigFactory {
  /** Create form configuration for service type */
  createConfiguration: (
    type: DatabaseDriver,
    mode: 'create' | 'edit' | 'clone' | 'view'
  ) => ServiceFormConfiguration;
  
  /** Create wizard steps for service type */
  createWizardSteps: (
    type: DatabaseDriver,
    features: Record<string, boolean>
  ) => WizardStepDefinition[];
  
  /** Create field definitions for service type */
  createFieldDefinitions: (
    type: DatabaseDriver,
    mode: 'create' | 'edit' | 'clone' | 'view'
  ) => FormField[];
  
  /** Create validation schema for service type */
  createValidationSchema: (
    type: DatabaseDriver,
    stepId?: string
  ) => z.ZodSchema<any>;
  
  /** Create layout configuration */
  createLayoutConfiguration: (
    type: DatabaseDriver,
    layout: LayoutType
  ) => FormLayout;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard for wizard database connection form data
 */
export function isWizardFormData(
  data: unknown
): data is WizardDatabaseConnectionFormData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as any).type === 'string'
  );
}

/**
 * Type guard for service form step data
 */
export function isServiceFormStep(
  step: unknown
): step is ServiceFormStepData {
  return (
    typeof step === 'object' &&
    step !== null &&
    'stepId' in step &&
    'isValid' in step &&
    'isComplete' in step
  );
}

/**
 * Type guard for paywall configuration
 */
export function isPaywallConfiguration(
  config: unknown
): config is PaywallConfiguration {
  return (
    typeof config === 'object' &&
    config !== null &&
    'feature' in config &&
    'tier' in config &&
    'isBlocked' in config
  );
}

/**
 * Utility to create initial wizard form data
 */
export function createInitialWizardFormData(
  type: DatabaseDriver,
  existingData?: Partial<WizardDatabaseConnectionFormData>
): Partial<WizardDatabaseConnectionFormData> {
  const baseData: Partial<WizardDatabaseConnectionFormData> = {
    type,
    is_active: true,
    stepData: {},
    connectionValidated: false,
    schemaDiscovered: false,
    securityConfigured: false,
    allowIncompleteSubmission: false,
    forceRevalidation: false,
    saveAsDraft: false,
    skipValidation: false,
  };
  
  return {
    ...baseData,
    ...existingData,
  };
}

/**
 * Utility to validate wizard step completion
 */
export function validateStepCompletion(
  step: WizardStepDefinition,
  data: Partial<WizardDatabaseConnectionFormData>
): boolean {
  if (step.optional) return true;
  if (step.validate) return false; // Async validation required
  
  // Basic validation based on step requirements
  const requiredFields = getStepRequiredFields(step.id);
  return requiredFields.every(field => {
    const value = getNestedValue(data, field);
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Helper to get required fields for a step
 */
function getStepRequiredFields(stepId: string): string[] {
  const stepFieldMap: Record<string, string[]> = {
    'service-type': ['type'],
    'connection': ['host', 'database', 'username', 'password'],
    'connection-test': ['connectionValidated'],
    'security': ['securityConfigured'],
    'review': ['type', 'host', 'database'],
  };
  
  return stepFieldMap[stepId] || [];
}

/**
 * Helper to get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Export commonly used types for external consumption
 */
export type {
  WizardDatabaseConnectionFormData as ServiceFormData,
  ServiceFormWizardProps as WizardProps,
  ServiceFormContainerProps as ContainerProps,
  DynamicFieldProps as FieldProps,
  ServiceFormState as FormState,
  WizardStepDefinition as StepDefinition,
  PaywallState as PaywallState,
};