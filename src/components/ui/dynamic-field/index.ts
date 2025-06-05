/**
 * Dynamic Field Component - Barrel Exports
 * 
 * Centralized export file for the React Dynamic Field component that replaces
 * Angular df-dynamic-field with React Hook Form integration and modern patterns.
 * 
 * This barrel export provides:
 * - Main DynamicField component with React 19 patterns
 * - Comprehensive TypeScript interfaces for all field types
 * - Field configuration schema types for service configuration
 * - Utility types for React Hook Form integration
 * - Named exports organized by functionality with tree-shaking support
 * 
 * @framework React 19 + Next.js 15.1
 * @styling Tailwind CSS 4.1+ with Headless UI components
 * @validation React Hook Form 7.52+ with Zod schema validation
 * @accessibility WCAG 2.1 AA compliant form field components
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// ================================
// Core Dynamic Field Component
// ================================

/**
 * Primary DynamicField component supporting all DreamFactory service configuration field types
 * Replaces Angular df-dynamic-field with React Hook Form integration and modern accessibility
 */
export { DynamicField, default as DynamicFieldDefault } from './dynamic-field';

// ================================
// Component Props and Interfaces
// ================================

/**
 * Main component props interface for type-safe field rendering
 * Supports React Hook Form integration with comprehensive validation
 */
export type { DynamicFieldProps } from './dynamic-field.types';

/**
 * Component ref interface for imperative field control
 * Enables programmatic focus, validation, and value manipulation
 */
export type { DynamicFieldRef } from './dynamic-field.types';

// ================================
// Field Type Definitions
// ================================

/**
 * Supported field types for DreamFactory service configuration
 * Covers all backend service configuration scenarios
 */
export type { DynamicFieldType } from './dynamic-field.types';

/**
 * Field value types supporting all input variations
 * Handles strings, numbers, booleans, files, and arrays with proper typing
 */
export type { DynamicFieldValue } from './dynamic-field.types';

/**
 * File upload value types for certificate and document handling
 * Supports both File objects and file path strings
 */
export type { FileValue, MultiFileValue } from './dynamic-field.types';

// ================================
// Configuration Schema Types
// ================================

/**
 * Field configuration schema interface maintaining backward compatibility
 * with existing DreamFactory service definitions and Angular implementation
 */
export type { ConfigSchema } from './dynamic-field.types';

/**
 * Validation schema types for runtime type checking with Zod integration
 * Provides comprehensive validation rules for all field types
 */
export type { FieldValidationSchema, ValidationMessages } from './dynamic-field.types';

// ================================
// Field-Specific Props Interfaces
// ================================

/**
 * Specialized props interfaces for different field types
 * Enables type-safe configuration for specific input scenarios
 */
export type {
  // Basic input fields
  TextFieldProps,
  NumberFieldProps,
  TextAreaFieldProps,
  BooleanFieldProps,
  
  // Selection and dropdown fields
  SelectFieldProps,
  SelectOption,
  
  // File handling fields
  FileFieldProps,
  
  // Event autocomplete fields
  EventFieldProps,
  EventOption,
  EventSearchResponse,
} from './dynamic-field.types';

// ================================
// Component Styling Types
// ================================

/**
 * Component variant and size types for consistent theming
 * Supports Tailwind CSS variants with class-variance-authority
 */
export type { ComponentVariant, ComponentSize } from './dynamic-field.types';

// ================================
// Form Integration Types
// ================================

/**
 * React Hook Form integration types for seamless form handling
 * Provides type-safe integration with useController and Control patterns
 */
export type {
  DynamicFieldFormProps,
  DynamicFieldEventHandlers,
  DynamicFieldBaseProps,
} from './dynamic-field.types';

// ================================
// Layout and Styling Configuration
// ================================

/**
 * Grid and layout configuration types for responsive form design
 * Enables responsive field layouts with breakpoint-based configuration
 */
export type {
  GridConfig,
  ConditionalConfig,
  FieldCondition,
  ConditionalAction,
  ComparisonOperator,
} from './dynamic-field.types';

/**
 * Field formatting and display configuration
 * Supports text transformation, currency, number, and date formatting
 */
export type {
  FieldFormatting,
  TextTransform,
  CurrencyConfig,
  NumberConfig,
  DateConfig,
} from './dynamic-field.types';

// ================================
// Theme and Accessibility Types
// ================================

/**
 * Theme configuration for dynamic fields with dark mode support
 * Provides comprehensive theming options for all field types
 */
export type { DynamicFieldTheme } from './dynamic-field.types';

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 * Ensures proper screen reader support and keyboard navigation
 */
export type { AccessibilityConfig } from './dynamic-field.types';

// ================================
// File Upload Integration Types
// ================================

/**
 * File upload event handlers and result types
 * Supports both local file selection and API-based file management
 */
export type {
  FileUploadEventHandlers,
  FileUploadError,
  FileUploadResult,
} from './dynamic-field.types';

// ================================
// Utility Types and Helpers
// ================================

/**
 * Utility types for type extraction and field value manipulation
 * Enables type-safe field configuration and value handling
 */
export type {
  ExtractFieldValue,
  RequiredProps,
  PartialConfig,
  DynamicFieldComponent,
} from './dynamic-field.types';

// ================================
// Re-exports for Convenience
// ================================

/**
 * Re-export commonly used React Hook Form types for convenience
 * Provides single import point for form integration dependencies
 */
export type {
  UseFormRegister,
  Control,
  FieldError,
  FieldValues,
  FieldPath,
  RegisterOptions,
  ControllerProps,
} from './dynamic-field.types';

/**
 * Re-export Zod validation types for schema construction
 * Enables type-safe validation schema creation
 */
export type { ZodSchema, ZodType } from './dynamic-field.types';

// ================================
// Default Export for Backward Compatibility
// ================================

/**
 * Default export object for components that need object destructuring
 * @note Prefer named exports for better tree-shaking and IDE support
 */
const DynamicFieldExports = {
  DynamicField,
} as const;

export default DynamicFieldExports;