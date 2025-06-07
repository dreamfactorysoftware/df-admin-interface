/**
 * Form Component TypeScript Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive type definitions for React Hook Form integration with Zod validation,
 * supporting database service configuration, schema discovery, and API generation workflows.
 * 
 * Key Features:
 * - React Hook Form 7.52+ integration with TypeScript 5.8+ type safety
 * - Zod schema validation for real-time form validation under 100ms
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Support for all database service types (MySQL, PostgreSQL, MongoDB, etc.)
 * - Dynamic field rendering with conditional logic and progressive disclosure
 * - Context-aware validation with React Query state synchronization
 * 
 * Replaces Angular Reactive Forms with modern React patterns.
 */

import { ReactNode, ComponentType, RefObject, CSSProperties } from 'react';
import { 
  Control, 
  FieldValues, 
  FieldPath, 
  FieldError, 
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormTrigger,
  UseFormFormState,
  UseFormHandleSubmit,
  UseFormReset,
  FormState,
  RegisterOptions,
  ValidationRule,
  FieldArrayWithId,
  UseFieldArrayReturn,
} from 'react-hook-form';
import { z } from 'zod';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  ComponentState,
  ResponsiveValue,
  GridConfig,
  FormFieldComponent,
  FieldValidationRules,
  SelectOption,
  LoadingState
} from '@/types/ui';
import { 
  FieldType, 
  FieldValidation, 
  ValidationMessages,
  SchemaField,
  DatabaseServiceConfig 
} from '@/types/schema';

// ============================================================================
// CORE FORM TYPES WITH REACT HOOK FORM INTEGRATION
// ============================================================================

/**
 * Enhanced form props interface with React Hook Form integration
 * Provides comprehensive type safety for all form operations
 */
export interface FormProps<TFieldValues extends FieldValues = FieldValues> extends BaseComponent {
  // React Hook Form integration
  control?: Control<TFieldValues>;
  register?: UseFormRegister<TFieldValues>;
  watch?: UseFormWatch<TFieldValues>;
  setValue?: UseFormSetValue<TFieldValues>;
  getValues?: UseFormGetValues<TFieldValues>;
  trigger?: UseFormTrigger<TFieldValues>;
  formState?: UseFormFormState<TFieldValues>;
  handleSubmit?: UseFormHandleSubmit<TFieldValues>;
  reset?: UseFormReset<TFieldValues>;
  
  // Form configuration
  schema?: z.ZodSchema<TFieldValues>;
  mode?: FormValidationMode;
  reValidateMode?: FormValidationMode;
  criteriaMode?: 'firstError' | 'all';
  shouldFocusError?: boolean;
  shouldUnregister?: boolean;
  shouldUseNativeValidation?: boolean;
  delayError?: number;
  
  // Form behavior
  onSubmit?: (data: TFieldValues) => void | Promise<void>;
  onInvalidSubmit?: (errors: FieldErrors<TFieldValues>) => void;
  onChange?: (data: TFieldValues) => void;
  onReset?: () => void;
  
  // Layout and styling
  layout?: FormLayout;
  spacing?: ComponentSize;
  variant?: FormVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  submitError?: string | null;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-busy'?: boolean;
  
  // Form sections and progressive disclosure
  sections?: FormSection[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  
  // Context providers
  providers?: FormProviderConfig;
}

/**
 * Form validation modes aligned with React Hook Form
 */
export type FormValidationMode = 
  | 'onSubmit'
  | 'onBlur' 
  | 'onChange'
  | 'onTouched'
  | 'all';

/**
 * Form variants for different use cases
 */
export type FormVariant = 
  | 'default'
  | 'inline'
  | 'card'
  | 'modal'
  | 'wizard'
  | 'settings'
  | 'database-config'
  | 'api-generation';

/**
 * Form layout configuration with responsive support
 */
export interface FormLayout {
  type: FormLayoutType;
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<ComponentSize>;
  grid?: GridConfig;
  maxWidth?: string;
  alignment?: 'left' | 'center' | 'right';
  
  // Section-specific layouts
  sectionLayout?: FormSectionLayout;
  fieldLayout?: FormFieldLayout;
}

export type FormLayoutType = 
  | 'single-column'
  | 'two-column' 
  | 'three-column'
  | 'auto-grid'
  | 'custom-grid'
  | 'inline'
  | 'stacked';

/**
 * Form section layout configuration
 */
export interface FormSectionLayout {
  collapsible?: boolean;
  bordered?: boolean;
  spacing?: ComponentSize;
  headerVariant?: ComponentVariant;
}

/**
 * Individual field layout configuration
 */
export interface FormFieldLayout {
  labelPosition?: 'top' | 'left' | 'inline' | 'floating';
  labelWidth?: string;
  fieldWidth?: string;
  helpTextPosition?: 'below' | 'side' | 'tooltip';
  errorPosition?: 'below' | 'side' | 'inline';
}

// ============================================================================
// FORM FIELD TYPES WITH ZOD INTEGRATION
// ============================================================================

/**
 * Enhanced form field props with comprehensive type safety
 * Integrates React Hook Form with Zod validation for database forms
 */
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldComponent {
  // React Hook Form integration
  name: TName;
  control?: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TName>;
  defaultValue?: TFieldValues[TName];
  
  // Zod schema integration
  schema?: z.ZodSchema;
  zodValidation?: ZodFieldValidation<TFieldValues[TName]>;
  
  // Field configuration
  type: FormFieldType;
  variant?: FormFieldVariant;
  size?: ComponentSize;
  fullWidth?: boolean;
  
  // Field state
  loading?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  
  // Conditional rendering
  condition?: FormFieldCondition<TFieldValues>;
  dependencies?: (keyof TFieldValues)[];
  
  // Enhanced validation
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  asyncValidation?: AsyncValidationFunction<TFieldValues[TName]>;
  
  // Field-specific props
  options?: SelectOption[];
  multiselect?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  createable?: boolean;
  
  // Input formatting
  mask?: string;
  format?: FieldFormatter;
  transform?: FieldTransformer;
  
  // Enhanced accessibility
  helpText?: string;
  helpTextId?: string;
  errorId?: string;
  describedBy?: string[];
  
  // Icon and addon support
  leftIcon?: ComponentType<{ className?: string }>;
  rightIcon?: ComponentType<{ className?: string }>;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  
  // Event handlers
  onValueChange?: (value: TFieldValues[TName]) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  
  // Grid layout
  gridColumn?: ResponsiveValue<string>;
  gridRow?: ResponsiveValue<string>;
  order?: ResponsiveValue<number>;
}

/**
 * Form field types supporting database configuration
 */
export type FormFieldType = 
  // Text inputs
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'search'
  
  // Numeric inputs
  | 'number'
  | 'range'
  | 'currency'
  
  // Selection inputs
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'toggle'
  | 'button-group'
  
  // Text areas and rich content
  | 'textarea'
  | 'code'
  | 'json'
  | 'markdown'
  | 'wysiwyg'
  
  // Date and time
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  
  // File and media
  | 'file'
  | 'image'
  | 'avatar'
  
  // Database-specific types
  | 'connection-string'
  | 'database-type'
  | 'port'
  | 'ssl-config'
  | 'schema-selector'
  | 'table-selector'
  | 'field-selector'
  
  // Advanced inputs
  | 'tags'
  | 'key-value'
  | 'color'
  | 'slider'
  | 'rating'
  | 'signature'
  
  // Dynamic fields
  | 'dynamic'
  | 'conditional'
  | 'fieldset'
  | 'array';

/**
 * Form field variants for different visual styles
 */
export type FormFieldVariant = 
  | 'default'
  | 'outlined'
  | 'filled'
  | 'underlined'
  | 'floating'
  | 'minimal'
  | 'database'
  | 'api-config';

/**
 * Conditional field rendering based on form state
 */
export interface FormFieldCondition<TFieldValues extends FieldValues = FieldValues> {
  when: keyof TFieldValues;
  operator: ConditionalOperator;
  value: any;
  action?: ConditionalAction;
  
  // Complex conditions
  and?: FormFieldCondition<TFieldValues>[];
  or?: FormFieldCondition<TFieldValues>[];
}

export type ConditionalOperator = 
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
  | 'isTrue'
  | 'isFalse'
  | 'matches'
  | 'in'
  | 'notIn';

export type ConditionalAction = 
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'focus'
  | 'clear'
  | 'validate';

// ============================================================================
// ZOD VALIDATION INTEGRATION
// ============================================================================

/**
 * Zod validation configuration for form fields
 * Provides type-safe validation with real-time feedback
 */
export interface ZodFieldValidation<T = any> {
  schema: z.ZodSchema<T>;
  parseOnChange?: boolean;
  parseOnBlur?: boolean;
  showErrorsOnMount?: boolean;
  
  // Custom error messages
  errorMap?: z.ZodErrorMap;
  customMessages?: ValidationMessages;
  
  // Async validation
  asyncValidator?: AsyncValidationFunction<T>;
  asyncDebounceMs?: number;
  
  // Validation timing
  validateOnDependencyChange?: boolean;
  revalidateOnFormChange?: boolean;
}

/**
 * Async validation function type
 */
export type AsyncValidationFunction<T = any> = (
  value: T,
  formData?: FieldValues
) => Promise<boolean | string>;

/**
 * Enhanced field validation results with Zod integration
 */
export interface FormFieldValidationResult {
  isValid: boolean;
  error?: FieldError;
  zodError?: z.ZodError;
  customError?: string;
  asyncError?: string;
  
  // Validation metadata
  validatedAt: Date;
  validationType: 'sync' | 'async' | 'zod' | 'custom';
  validationDuration: number;
  
  // Field state
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
}

/**
 * Form validation state with comprehensive error tracking
 */
export interface FormValidationState<TFieldValues extends FieldValues = FieldValues> {
  isValid: boolean;
  isValidating: boolean;
  errors: FieldErrors<TFieldValues>;
  zodErrors?: z.ZodError<TFieldValues>;
  
  // Field-level validation states
  fieldStates: Record<FieldPath<TFieldValues>, FormFieldValidationResult>;
  
  // Validation timing
  lastValidation?: Date;
  validationCount: number;
  averageValidationTime: number;
  
  // Submission state
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
  
  // Error summary
  errorSummary: FormErrorSummary;
}

/**
 * Form error summary for accessibility and UX
 */
export interface FormErrorSummary {
  totalErrors: number;
  fieldErrors: number;
  zodErrors: number;
  asyncErrors: number;
  customErrors: number;
  
  // Error categorization
  criticalErrors: string[];
  warningErrors: string[];
  infoErrors: string[];
  
  // Accessibility
  errorListId: string;
  focusOnFirstError: boolean;
  announceErrors: boolean;
}

// ============================================================================
// FIELD FORMATTERS AND TRANSFORMERS
// ============================================================================

/**
 * Field value formatter for display and input transformation
 */
export interface FieldFormatter {
  type: FormatterType;
  options?: FormatterOptions;
  
  // Custom formatters
  format?: (value: any) => string;
  parse?: (value: string) => any;
  
  // Validation integration
  validateFormatted?: boolean;
  preserveOriginalValue?: boolean;
}

export type FormatterType = 
  | 'currency'
  | 'number'
  | 'percentage'
  | 'phone'
  | 'ssn'
  | 'creditCard'
  | 'date'
  | 'time'
  | 'datetime'
  | 'duration'
  | 'fileSize'
  | 'json'
  | 'sql'
  | 'connectionString'
  | 'custom';

export interface FormatterOptions {
  // Currency formatting
  currency?: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  
  // Number formatting
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  
  // Date formatting
  dateFormat?: string;
  timeFormat?: string;
  timeZone?: string;
  locale?: string;
  
  // Custom formatting
  mask?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  
  // Database-specific formatting
  quotingStyle?: 'single' | 'double' | 'backtick' | 'bracket';
  escapeChars?: boolean;
}

/**
 * Field value transformer for data processing
 */
export interface FieldTransformer {
  type: TransformerType;
  
  // Transform functions
  toDisplay?: (value: any) => any;
  fromDisplay?: (value: any) => any;
  toSubmit?: (value: any) => any;
  fromSubmit?: (value: any) => any;
  
  // Transform options
  options?: TransformerOptions;
  
  // Validation integration
  validateTransformed?: boolean;
  preserveType?: boolean;
}

export type TransformerType = 
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'capitalize'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase'
  | 'slugify'
  | 'sanitize'
  | 'encrypt'
  | 'hash'
  | 'base64'
  | 'url'
  | 'json'
  | 'csv'
  | 'custom';

export interface TransformerOptions {
  // String transformations
  preserveWhitespace?: boolean;
  removeAccents?: boolean;
  
  // Sanitization options
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  
  // Encryption options
  algorithm?: string;
  key?: string;
  
  // Custom options
  customOptions?: Record<string, any>;
}

// ============================================================================
// FORM SECTIONS AND PROGRESSIVE DISCLOSURE
// ============================================================================

/**
 * Form section configuration for complex forms
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  
  // Section behavior
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  
  // Section fields
  fields: string[];
  subSections?: FormSection[];
  
  // Conditional sections
  condition?: FormFieldCondition;
  dependencies?: string[];
  
  // Layout
  layout?: FormSectionLayout;
  order?: number;
  grid?: GridConfig;
  
  // Validation
  validateSection?: boolean;
  requiredFields?: string[];
  
  // Accessibility
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Progressive disclosure configuration for complex workflows
 */
export interface ProgressiveDisclosure {
  enabled: boolean;
  strategy: DisclosureStrategy;
  
  // Step-based disclosure
  steps?: DisclosureStep[];
  currentStep?: number;
  
  // Dependency-based disclosure
  dependencies?: FieldDependency[];
  
  // Animation and UX
  animationDuration?: number;
  showProgress?: boolean;
  allowSkipping?: boolean;
  
  // Accessibility
  announceSteps?: boolean;
  focusManagement?: boolean;
}

export type DisclosureStrategy = 
  | 'step-by-step'
  | 'dependency-based'
  | 'progressive-enhancement'
  | 'accordion'
  | 'tabs'
  | 'wizard';

export interface DisclosureStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  sections?: string[];
  
  // Step behavior
  required?: boolean;
  skippable?: boolean;
  
  // Validation
  validateOnNext?: boolean;
  validateOnPrevious?: boolean;
  
  // Navigation
  nextButtonText?: string;
  previousButtonText?: string;
  
  // Accessibility
  stepNumber?: number;
  totalSteps?: number;
}

export interface FieldDependency {
  field: string;
  dependsOn: string[];
  condition: FormFieldCondition;
  action: ConditionalAction;
}

// ============================================================================
// FORM CONTEXT AND STATE MANAGEMENT
// ============================================================================

/**
 * Form context provider configuration
 */
export interface FormProviderConfig {
  // React Query integration
  enableReactQuery?: boolean;
  queryClient?: any; // QueryClient from @tanstack/react-query
  
  // State management
  enableGlobalState?: boolean;
  stateKey?: string;
  persistState?: boolean;
  
  // Validation providers
  enableZodValidation?: boolean;
  enableAsyncValidation?: boolean;
  
  // Accessibility providers
  enableA11yValidation?: boolean;
  screenReaderAnnouncements?: boolean;
  
  // Error boundaries
  enableErrorBoundary?: boolean;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Form context value with comprehensive state management
 */
export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  // Form state
  formState: FormState<TFieldValues>;
  validationState: FormValidationState<TFieldValues>;
  loadingState: LoadingState;
  
  // Form methods
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  trigger: UseFormTrigger<TFieldValues>;
  reset: UseFormReset<TFieldValues>;
  
  // Enhanced methods
  validateField: (fieldName: FieldPath<TFieldValues>) => Promise<FormFieldValidationResult>;
  validateForm: () => Promise<FormValidationState<TFieldValues>>;
  clearErrors: (fieldName?: FieldPath<TFieldValues>) => void;
  setFieldError: (fieldName: FieldPath<TFieldValues>, error: FieldError) => void;
  
  // Section management
  sections: FormSection[];
  expandSection: (sectionId: string) => void;
  collapseSection: (sectionId: string) => void;
  toggleSection: (sectionId: string) => void;
  
  // Progressive disclosure
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepNumber: number) => void;
  
  // Utility methods
  isDirty: (fieldName?: FieldPath<TFieldValues>) => boolean;
  isTouched: (fieldName?: FieldPath<TFieldValues>) => boolean;
  isValid: (fieldName?: FieldPath<TFieldValues>) => boolean;
  hasErrors: (fieldName?: FieldPath<TFieldValues>) => boolean;
  
  // Event handlers
  onFieldChange: (fieldName: FieldPath<TFieldValues>, value: any) => void;
  onFieldBlur: (fieldName: FieldPath<TFieldValues>) => void;
  onFieldFocus: (fieldName: FieldPath<TFieldValues>) => void;
  
  // Accessibility
  announceError: (message: string) => void;
  focusField: (fieldName: FieldPath<TFieldValues>) => void;
  getFieldDescribedBy: (fieldName: FieldPath<TFieldValues>) => string;
}

// ============================================================================
// FIELD ARRAY TYPES FOR DYNAMIC FORMS
// ============================================================================

/**
 * Field array configuration for dynamic form fields
 */
export interface FormFieldArrayProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseComponent {
  // Field array configuration
  name: TName;
  control?: Control<TFieldValues>;
  defaultValue?: any[];
  
  // Array behavior
  maxItems?: number;
  minItems?: number;
  sortable?: boolean;
  removable?: boolean;
  addable?: boolean;
  
  // Field array methods
  fieldArray?: UseFieldArrayReturn<TFieldValues, TName>;
  
  // Rendering
  renderItem: (item: FieldArrayItemProps<TFieldValues, TName>) => ReactNode;
  renderAddButton?: (onAdd: () => void) => ReactNode;
  renderRemoveButton?: (onRemove: () => void, index: number) => ReactNode;
  renderMoveButtons?: (onMoveUp: () => void, onMoveDown: () => void, index: number) => ReactNode;
  
  // Labels and text
  addButtonText?: string;
  removeButtonText?: string;
  emptyStateText?: string;
  maxItemsReachedText?: string;
  
  // Validation
  validateArray?: boolean;
  itemValidation?: z.ZodSchema;
  
  // Accessibility
  itemLabel?: (index: number) => string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Field array item properties
 */
export interface FieldArrayItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  field: FieldArrayWithId<TFieldValues, TName>;
  index: number;
  control: Control<TFieldValues>;
  
  // Item methods
  remove: () => void;
  moveUp: () => void;
  moveDown: () => void;
  
  // Item state
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  canMove: boolean;
  
  // Accessibility
  itemId: string;
  labelledBy: string;
}

// ============================================================================
// DATABASE-SPECIFIC FORM TYPES
// ============================================================================

/**
 * Database service configuration form values
 */
export interface DatabaseServiceFormValues extends DatabaseServiceConfig {
  // Enhanced form fields
  serviceName: string;
  serviceLabel?: string;
  serviceDescription?: string;
  
  // Connection testing
  testConnection?: boolean;
  connectionTestResult?: ConnectionTestResult;
  
  // Advanced configuration
  advancedConfig?: DatabaseAdvancedConfig;
  securityConfig?: DatabaseSecurityConfig;
  performanceConfig?: DatabasePerformanceConfig;
}

export interface DatabaseAdvancedConfig {
  // Connection pool
  enablePooling: boolean;
  poolMinConnections: number;
  poolMaxConnections: number;
  poolTimeout: number;
  
  // Caching
  enableCaching: boolean;
  cacheTimeout: number;
  
  // Logging
  enableQueryLogging: boolean;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

export interface DatabaseSecurityConfig {
  // SSL configuration
  enableSSL: boolean;
  sslMode: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
  sslCertificate?: string;
  sslKey?: string;
  sslCA?: string;
  
  // Access control
  enableAccessControl: boolean;
  allowedIPs: string[];
  deniedIPs: string[];
  
  // Encryption
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface DatabasePerformanceConfig {
  // Query optimization
  queryTimeout: number;
  maxQueryComplexity: number;
  enableQueryCache: boolean;
  
  // Connection optimization
  connectionTimeout: number;
  maxConcurrentConnections: number;
  
  // Monitoring
  enablePerformanceMonitoring: boolean;
  performanceThresholds: {
    slowQueryThreshold: number;
    memoryUsageThreshold: number;
    connectionCountThreshold: number;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  duration: number;
  timestamp: string;
  
  // Extended test results
  connectionLatency?: number;
  serverVersion?: string;
  availableDatabases?: string[];
  supportedFeatures?: string[];
  
  // Error details
  errorCode?: string;
  errorDetails?: Record<string, any>;
  troubleshootingSteps?: string[];
}

// ============================================================================
// SCHEMA DISCOVERY FORM TYPES
// ============================================================================

/**
 * Schema discovery configuration form values
 */
export interface SchemaDiscoveryFormValues {
  // Discovery options
  includeTables: boolean;
  includeViews: boolean;
  includeProcedures: boolean;
  includeFunctions: boolean;
  includeSequences: boolean;
  
  // Filtering options
  tableFilter?: string;
  schemaFilter?: string;
  excludeSystemTables: boolean;
  excludeEmptyTables: boolean;
  
  // Performance options
  maxTablesPerBatch: number;
  discoveryTimeout: number;
  enableProgressiveLoading: boolean;
  
  // Field discovery
  includeFieldMetadata: boolean;
  includeRelationships: boolean;
  includeIndexes: boolean;
  includeConstraints: boolean;
  
  // Cache options
  enableCaching: boolean;
  cacheTimeout: number;
  forceRefresh: boolean;
}

// ============================================================================
// API GENERATION FORM TYPES
// ============================================================================

/**
 * API generation configuration form values
 */
export interface APIGenerationFormValues {
  // Endpoint configuration
  basePath: string;
  apiVersion: string;
  enableVersioning: boolean;
  
  // HTTP methods
  enableGET: boolean;
  enablePOST: boolean;
  enablePUT: boolean;
  enablePATCH: boolean;
  enableDELETE: boolean;
  
  // Security configuration
  enableAuthentication: boolean;
  authenticationMethods: string[];
  enableAuthorization: boolean;
  defaultRole?: string;
  
  // Response configuration
  responseFormat: 'json' | 'xml' | 'yaml';
  enablePagination: boolean;
  defaultPageSize: number;
  maxPageSize: number;
  
  // OpenAPI documentation
  generateOpenAPI: boolean;
  apiTitle: string;
  apiDescription?: string;
  apiContact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  
  // Field configuration
  fieldConfiguration: Record<string, APIFieldConfig>;
}

export interface APIFieldConfig {
  exposed: boolean;
  readonly: boolean;
  required: boolean;
  filterable: boolean;
  sortable: boolean;
  
  // Validation
  validation?: FieldValidation;
  
  // Formatting
  format?: string;
  example?: any;
  description?: string;
  
  // Relationships
  includeRelated?: boolean;
  relatedFields?: string[];
}

// ============================================================================
// UTILITY TYPES AND EXPORTS
// ============================================================================

/**
 * Form field ref type for imperative operations
 */
export type FormFieldRef = RefObject<{
  focus: () => void;
  blur: () => void;
  validate: () => Promise<FormFieldValidationResult>;
  clear: () => void;
  reset: () => void;
  getValue: () => any;
  setValue: (value: any) => void;
}>;

/**
 * Form submission result type
 */
export interface FormSubmissionResult<TFieldValues extends FieldValues = FieldValues> {
  success: boolean;
  data?: TFieldValues;
  errors?: FieldErrors<TFieldValues>;
  message?: string;
  
  // Extended result information
  submissionId?: string;
  timestamp: string;
  duration: number;
  
  // Redirect or next action
  redirect?: string;
  nextAction?: 'reload' | 'reset' | 'redirect' | 'continue';
}

/**
 * Form error boundary props
 */
export interface FormErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<FormErrorBoundaryState>;
  onError?: (error: Error, errorInfo: any) => void;
}

export interface FormErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retry: () => void;
}

/**
 * Form performance metrics
 */
export interface FormPerformanceMetrics {
  renderTime: number;
  validationTime: number;
  submissionTime: number;
  
  // Field-level metrics
  fieldRenderTimes: Record<string, number>;
  fieldValidationTimes: Record<string, number>;
  
  // Memory usage
  estimatedMemoryUsage: number;
  componentCount: number;
  
  // User interaction metrics
  interactionCount: number;
  errorCount: number;
  validationCount: number;
}

// Re-export commonly used types for convenience
export type {
  Control,
  FieldValues,
  FieldPath,
  FieldError,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormTrigger,
  UseFormFormState,
  UseFormHandleSubmit,
  UseFormReset,
  FormState,
  RegisterOptions,
  ValidationRule,
  FieldArrayWithId,
  UseFieldArrayReturn
} from 'react-hook-form';

export type { ZodSchema, ZodError, ZodErrorMap } from 'zod';

// Default exports for common form configurations
export const DEFAULT_FORM_CONFIG: Partial<FormProps> = {
  mode: 'onSubmit',
  reValidateMode: 'onChange',
  criteriaMode: 'firstError',
  shouldFocusError: true,
  shouldUnregister: false,
  shouldUseNativeValidation: false,
  delayError: 300,
  layout: {
    type: 'single-column',
    gap: 'md',
    alignment: 'left'
  },
  variant: 'default',
  spacing: 'md',
  fullWidth: true
};

export const DEFAULT_FIELD_CONFIG: Partial<FormFieldProps> = {
  variant: 'default',
  size: 'md',
  fullWidth: true,
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: 300
};

export const DATABASE_FORM_CONFIG: Partial<FormProps<DatabaseServiceFormValues>> = {
  ...DEFAULT_FORM_CONFIG,
  variant: 'database-config',
  layout: {
    type: 'two-column',
    gap: 'lg',
    alignment: 'left',
    sectionLayout: {
      collapsible: true,
      bordered: true,
      spacing: 'lg'
    }
  }
};