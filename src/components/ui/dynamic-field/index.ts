/**
 * Dynamic Field Component System - Main Export File
 * 
 * Centralizes all dynamic field-related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular df-dynamic-field component.
 * 
 * This barrel export provides clean imports for:
 * - DynamicField component (main form field component)
 * - Individual field type components (StringField, IntegerField, etc.)
 * - TypeScript interfaces and type definitions
 * - Utility functions for field management and validation
 * - Field variant styling classes and configurations
 * - Validation schemas and type guards
 * 
 * Features:
 * - React Hook Form 7.52+ integration with full type safety
 * - WCAG 2.1 AA accessibility compliance throughout
 * - TypeScript 5.8+ comprehensive type definitions
 * - Tailwind CSS 4.1+ design system integration
 * - Support for all DreamFactory field types and configurations
 * - Zod schema validation for configuration validation
 * - Real-time validation with debouncing under 100ms
 * - Dark theme support via Zustand store integration
 * - Performance optimized with React.memo and useMemo
 * 
 * @example
 * ```tsx
 * // Import the primary DynamicField component
 * import { DynamicField } from '@/components/ui/dynamic-field';
 * 
 * // Import specific field components
 * import { StringField, BooleanField } from '@/components/ui/dynamic-field';
 * 
 * // Import types and utilities
 * import { 
 *   type DynamicFieldProps, 
 *   type FieldConfig,
 *   validateFieldValue 
 * } from '@/components/ui/dynamic-field';
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see React Hook Form Integration Requirements
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY DYNAMIC FIELD COMPONENT EXPORTS
// =============================================================================

/**
 * Main DynamicField component - Primary export for dynamic form field rendering
 * 
 * Replaces Angular df-dynamic-field with comprehensive React 19 implementation featuring:
 * - Support for all DreamFactory field types (string, integer, password, text, boolean, picklist, multi_picklist, file_certificate, file_certificate_api, event_picklist)
 * - React Hook Form integration with useController for seamless form management
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Real-time validation with customizable debouncing
 * - Dark theme support with consistent design tokens
 * - File upload capabilities with drag-and-drop and validation
 * - Event data fetching with React Query caching
 * - Headless UI components for accessible interactions
 * - Performance optimized for large forms with 1000+ fields
 */
export { 
  DynamicField as default,
  DynamicField,
} from './dynamic-field';

/**
 * DynamicField component prop interfaces and types
 * Provides comprehensive TypeScript support for all field configurations
 */
export type { 
  DynamicFieldProps,
} from './dynamic-field';

// =============================================================================
// INDIVIDUAL FIELD TYPE COMPONENT EXPORTS
// =============================================================================

/**
 * Individual field type components for specialized usage
 * 
 * Provides direct access to field-specific components for cases where
 * full dynamic field functionality is not needed:
 * - StringField: Text input with masking and transformation support
 * - IntegerField: Numeric input with min/max validation and formatting
 * - TextField: Multi-line textarea with syntax highlighting support
 * - BooleanField: Switch/checkbox toggle with flexible label positioning
 * - PicklistField: Single-select dropdown with search and grouping
 * - MultiPicklistField: Multi-select dropdown with tag display
 * - FileCertificateField: File upload for SSL certificates and keys
 * - FileCertificateApiField: File upload with API validation
 * - EventPicklistField: Combobox for event selection with filtering
 */
export {
  StringField,
  IntegerField,
  TextField,
  BooleanField,
  PicklistField,
  MultiPicklistField,
  FileCertificateField,
  FileCertificateApiField,
  EventPicklistField,
} from './dynamic-field';

// =============================================================================
// FIELD TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Core field type definitions and value types
 * Provides type safety for all supported DreamFactory field types
 */
export type {
  DynamicFieldType,
  DynamicFieldValue,
  AnyFieldValue,
  FieldChangeEvent,
} from './dynamic-field.types';

/**
 * Field configuration interfaces for all supported types
 * Enables type-safe field configuration throughout the application
 */
export type {
  FieldConfig,
  StringFieldConfig,
  IntegerFieldConfig,
  PasswordFieldConfig,
  TextFieldConfig,
  BooleanFieldConfig,
  PicklistFieldConfig,
  MultiPicklistFieldConfig,
  FileCertificateFieldConfig,
  FileCertificateApiFieldConfig,
  EventPicklistFieldConfig,
} from './dynamic-field.types';

/**
 * Configuration schema and validation interfaces
 * Supports dynamic form generation from JSON schemas
 */
export type {
  ConfigSchema,
  FieldValidationConfig,
  ConditionalConfig,
  SchemaFieldMapping,
} from './dynamic-field.types';

/**
 * React Hook Form integration types
 * Provides seamless integration with React Hook Form ecosystem
 */
export type {
  ReactHookFormProps,
  AccessibilityProps,
} from './dynamic-field.types';

/**
 * Supporting configuration types for specialized field features
 */
export type {
  TextTransform,
  NumberFormatting,
  PasswordRequirements,
  CodeSyntax,
  RemoteDataConfig,
  FileValidationConfig,
  EventSourceConfig,
  EventOption,
  EventFilter,
  FieldThemeConfig,
  CustomComponentOverrides,
} from './dynamic-field.types';

/**
 * Utility types for advanced field manipulation
 */
export type {
  ExtractFieldConfig,
  FieldValueGetter,
  FieldValueSetter,
} from './dynamic-field.types';

// =============================================================================
// FIELD VARIANT UTILITIES AND STYLING
// =============================================================================

/**
 * Field styling variants and utility functions
 * 
 * Provides comprehensive styling system with:
 * - WCAG 2.1 AA compliant color combinations and contrast ratios
 * - Design token integration via Tailwind CSS 4.1+
 * - Dynamic class generation with class-variance-authority
 * - Theme-aware styling for light and dark modes
 * - Size variants for different form layouts
 * - Error state styling with accessible color indicators
 * - Focus ring utilities for keyboard navigation compliance
 */
export {
  dynamicFieldVariants,
  inputVariants,
  labelVariants,
  errorMessageVariants,
  helpTextVariants,
} from './dynamic-field';

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Field utility functions for validation, transformation, and management
 * 
 * Provides essential functionality for:
 * - Field ID generation for accessibility compliance
 * - Error message extraction from various error formats
 * - Field type checking and validation
 * - Value transformation based on field configuration
 * - Cross-field validation support
 */
export {
  generateFieldId,
  getErrorMessage,
  isMultiValueField,
  isFileField,
  isRemoteField,
  validateFieldValue,
  transformFieldValue,
} from './dynamic-field';

/**
 * Type guard functions for runtime type checking
 * Enables safe type narrowing and conditional logic based on field types
 */
export {
  isFieldType,
  isMultiValueField as isMultiValueFieldType,
  isFileField as isFileFieldType,
  isRemoteField as isRemoteFieldType,
} from './dynamic-field.types';

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schemas for configuration validation
 * 
 * Provides runtime validation for:
 * - Field configuration objects
 * - Form schema definitions
 * - Validation rule configurations
 * - Event source configurations
 * 
 * Ensures type safety and prevents configuration errors at runtime
 */
export {
  FieldValidationConfigSchema,
  BaseFieldConfigSchema,
  ConfigSchemaSchema,
} from './dynamic-field.types';

// =============================================================================
// CONVENIENCE RE-EXPORTS AND COLLECTIONS
// =============================================================================

/**
 * Complete dynamic field component collection for bulk imports
 * Useful for component libraries, documentation systems, and form builders
 * 
 * @example
 * ```tsx
 * import { DynamicFieldComponents } from '@/components/ui/dynamic-field';
 * 
 * // Access all components through the collection
 * const { DynamicField, StringField, BooleanField } = DynamicFieldComponents;
 * ```
 */
export const DynamicFieldComponents = {
  DynamicField,
  StringField,
  IntegerField,
  TextField,
  BooleanField,
  PicklistField,
  MultiPicklistField,
  FileCertificateField,
  FileCertificateApiField,
  EventPicklistField,
} as const;

/**
 * Dynamic field utilities collection for bulk imports
 * Provides access to all utility functions and validation helpers
 * 
 * @example
 * ```tsx
 * import { DynamicFieldUtils } from '@/components/ui/dynamic-field';
 * 
 * // Access utilities through the collection
 * const isValid = DynamicFieldUtils.validateFieldValue(value, config);
 * const fieldId = DynamicFieldUtils.generateFieldId(name, type);
 * ```
 */
export const DynamicFieldUtils = {
  generateFieldId,
  getErrorMessage,
  isMultiValueField,
  isFileField,
  isRemoteField,
  validateFieldValue,
  transformFieldValue,
  isFieldType,
} as const;

/**
 * Dynamic field styling collection for bulk imports
 * Consolidates all styling variants and class generators
 * 
 * @example
 * ```tsx
 * import { DynamicFieldStyles } from '@/components/ui/dynamic-field';
 * 
 * // Access styling utilities through the collection
 * const inputClasses = DynamicFieldStyles.inputVariants({
 *   theme: 'dark',
 *   error: true,
 *   size: 'lg'
 * });
 * ```
 */
export const DynamicFieldStyles = {
  dynamicFieldVariants,
  inputVariants,
  labelVariants,
  errorMessageVariants,
  helpTextVariants,
} as const;

/**
 * Validation schema collection for configuration validation
 * Provides access to all Zod schemas for runtime validation
 * 
 * @example
 * ```tsx
 * import { DynamicFieldSchemas } from '@/components/ui/dynamic-field';
 * 
 * // Validate field configuration
 * const result = DynamicFieldSchemas.BaseFieldConfigSchema.parse(config);
 * ```
 */
export const DynamicFieldSchemas = {
  FieldValidationConfigSchema,
  BaseFieldConfigSchema,
  ConfigSchemaSchema,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for dynamic field system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface DynamicFieldSystemTypes {
  DynamicFieldProps: DynamicFieldProps;
  FieldConfig: FieldConfig;
  ConfigSchema: ConfigSchema;
  StringFieldConfig: StringFieldConfig;
  IntegerFieldConfig: IntegerFieldConfig;
  PasswordFieldConfig: PasswordFieldConfig;
  TextFieldConfig: TextFieldConfig;
  BooleanFieldConfig: BooleanFieldConfig;
  PicklistFieldConfig: PicklistFieldConfig;
  MultiPicklistFieldConfig: MultiPicklistFieldConfig;
  FileCertificateFieldConfig: FileCertificateFieldConfig;
  FileCertificateApiFieldConfig: FileCertificateApiFieldConfig;
  EventPicklistFieldConfig: EventPicklistFieldConfig;
  FieldValidationConfig: FieldValidationConfig;
  FieldChangeEvent: FieldChangeEvent;
}

/**
 * Dynamic field type union for configuration-driven field rendering
 * Useful for form builders and dynamic schema processing
 */
export type DynamicFieldTypeUnion = DynamicFieldType;

/**
 * Field value union type for type-safe value handling
 * Enables proper type checking for all field value types
 */
export type DynamicFieldValueUnion = AnyFieldValue;

/**
 * Field configuration union type for dynamic form generation
 * Supports all possible field configuration combinations
 */
export type DynamicFieldConfigUnion = FieldConfig;

// =============================================================================
// ACCESSIBILITY AND VALIDATION CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for dynamic field system
 * Provides reference values for accessibility validation and testing
 */
export const DYNAMIC_FIELD_ACCESSIBILITY_CONSTANTS = {
  /**
   * Minimum touch target size per WCAG guidelines
   */
  MIN_TOUCH_TARGET: {
    width: 44,
    height: 44,
  },
  
  /**
   * Minimum contrast ratios for AA compliance
   */
  CONTRAST_RATIOS: {
    normalText: 4.5,
    errorText: 4.5,
    placeholderText: 3.0,
    helperText: 4.5,
  },
  
  /**
   * Focus ring specifications for keyboard navigation
   */
  FOCUS_RING: {
    width: 2,
    offset: 2,
    borderRadius: 4,
  },
  
  /**
   * Animation and transition constants
   */
  TIMING: {
    transition: 200, // milliseconds
    debounce: 300, // milliseconds for validation debouncing
    announcement: 1000, // milliseconds for screen reader announcements
  },
  
  /**
   * ARIA labels and descriptions
   */
  ARIA: {
    requiredSuffix: ' (required)',
    optionalSuffix: ' (optional)',
    errorPrefix: 'Error: ',
    loadingLabel: 'Loading',
    selectPlaceholder: 'Select an option',
    multiSelectPlaceholder: 'Select options',
  },
} as const;

/**
 * Default field validation configuration for consistent validation behavior
 */
export const DEFAULT_VALIDATION_CONFIG = {
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: 300,
  showErrorsImmediately: false,
  clearErrorsOnChange: true,
} as const;

/**
 * Default field configuration for consistent application defaults
 */
export const DEFAULT_FIELD_CONFIG = {
  required: false,
  disabled: false,
  readonly: false,
  hidden: false,
  size: 'md' as const,
  variant: 'default' as const,
  fullWidth: true,
  clearable: false,
  searchable: true,
} as const;

/**
 * Supported file types for certificate fields
 * Provides validation reference for file upload fields
 */
export const CERTIFICATE_FILE_TYPES = {
  FORMATS: ['.p8', '.pem', '.key', '.crt', '.cer', '.pfx', '.p12'],
  MIME_TYPES: [
    'application/x-pkcs8',
    'application/x-pem-file',
    'application/pkix-cert',
    'application/x-pkcs12',
    'application/x-x509-ca-cert',
  ],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Event field configuration constants
 * Provides defaults for event picklist functionality
 */
export const EVENT_FIELD_DEFAULTS = {
  SEARCH_DELAY: 300, // milliseconds
  MIN_SEARCH_LENGTH: 2,
  MAX_OPTIONS: 100,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;