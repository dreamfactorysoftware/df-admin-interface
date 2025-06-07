/**
 * Lookup Keys Component System - Main Export File
 * 
 * Centralizes all lookup-keys related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular df-lookup-keys component.
 * 
 * This barrel export provides clean imports for:
 * - LookupKeys component (primary interactive table for key-value management)
 * - TypeScript interfaces and type definitions for form integration
 * - Zod validation schemas for runtime type checking
 * - Utility functions and type guards for lookup key operations
 * - Default configurations and accessibility constants
 * 
 * Features:
 * - WCAG 2.1 AA compliant lookup key management interface
 * - React Hook Form integration with useFieldArray support
 * - TypeScript 5.8+ type safety throughout
 * - Tailwind CSS 4.1+ design system integration
 * - Zod schema validation with unique name constraint checking
 * - Privacy toggle controls for sensitive configuration values
 * - Accordion layout with table display for organized presentation
 * - Comprehensive keyboard navigation and screen reader support
 * 
 * @example
 * ```tsx
 * // Import the primary LookupKeys component
 * import { LookupKeys } from '@/components/ui/lookup-keys';
 * 
 * // Import specific types and utilities
 * import { 
 *   LookupKeyEntry, 
 *   lookupKeySchema,
 *   isLookupKeyEntry 
 * } from '@/components/ui/lookup-keys';
 * 
 * // Usage with React Hook Form
 * import { useFieldArray } from 'react-hook-form';
 * 
 * function ConfigurationForm() {
 *   return (
 *     <LookupKeys 
 *       name="lookupKeys"
 *       showAccordion={true}
 *       maxEntries={50}
 *     />
 *   );
 * }
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES  
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY LOOKUP KEYS COMPONENT EXPORTS
// =============================================================================

/**
 * Main LookupKeys component - Primary export for key-value pair management
 * 
 * Replaces Angular df-lookup-keys component with comprehensive React 19 implementation featuring:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - React Hook Form integration with useFieldArray for dynamic array management
 * - Privacy toggle controls for sensitive configuration values
 * - Table display with inline editing and validation
 * - Accordion layout option for organized presentation
 * - Keyboard navigation and screen reader support
 * - Zod schema validation with unique name constraint checking
 * - Dynamic add/remove functionality with proper focus management
 */
export { 
  LookupKeys as default,
  LookupKeys,
} from './lookup-keys';

/**
 * LookupKeys component prop interfaces and configuration types
 * Provides comprehensive TypeScript support for all lookup keys configurations
 */
export type { 
  LookupKeysProps,
} from './lookup-keys';

// =============================================================================
// CORE DATA TYPES AND INTERFACES
// =============================================================================

/**
 * Core lookup key entry interface
 * Represents the fundamental structure of a key-value pair with privacy controls
 */
export type {
  LookupKeyEntry,
  LookupKeyCreatePayload,
  LookupKeyUpdatePayload,
} from './lookup-keys.types';

/**
 * Form integration interfaces for React Hook Form compatibility
 * Enables seamless integration with useFieldArray and form validation
 */
export type {
  LookupKeysFormValues,
  LookupKeysFieldArrayConfig,
  LookupKeysFieldArrayReturn,
} from './lookup-keys.types';

/**
 * Component styling and display configuration types
 * Provides type-safe styling options following design system patterns
 */
export type {
  LookupKeysLayoutVariant,
  LookupKeysSize,
  LookupKeysColorVariant,
  LookupKeysStyling,
} from './lookup-keys.types';

/**
 * Accessibility configuration interfaces for WCAG 2.1 AA compliance
 * Ensures proper screen reader support and keyboard navigation
 */
export type {
  LookupKeysAccessibility,
  LookupKeysFocusConfig,
} from './lookup-keys.types';

/**
 * Event handler interfaces for component interactions
 * Provides type-safe callback functions for lookup key operations
 */
export type {
  LookupKeyEntryEventData,
  LookupKeysEventHandlers,
} from './lookup-keys.types';

// =============================================================================
// VALIDATION SCHEMAS AND TYPES
// =============================================================================

/**
 * Zod validation schemas for runtime type checking and form validation
 * 
 * Includes:
 * - Individual lookup key entry validation with format constraints
 * - Array-level validation with unique name constraint checking
 * - Form-level validation for complete form structures
 */
export { 
  lookupKeySchema,
  lookupKeysArraySchema,
} from './lookup-keys';

/**
 * Zod validation schema types for TypeScript integration
 * Enables compile-time type inference from runtime validation schemas
 */
export type {
  LookupKeyEntrySchema,
  LookupKeysArraySchema,
  LookupKeysFormSchema,
  LookupKeysValidationErrors,
} from './lookup-keys.types';

// =============================================================================
// UTILITY FUNCTIONS AND TYPE GUARDS
// =============================================================================

/**
 * Type guard functions for runtime type checking
 * Provides safe type assertion for lookup key data validation
 */
export {
  isLookupKeyEntry,
  isLookupKeyEntryArray,
} from './lookup-keys.types';

/**
 * Utility type for extracting lookup keys from complex form structures
 * Helpful for working with nested form values and data transformation
 */
export type {
  ExtractLookupKeys,
  LookupKeyFieldPath,
} from './lookup-keys.types';

/**
 * Component ref interface for imperative operations
 * Enables direct component manipulation when needed for advanced use cases
 */
export type {
  LookupKeysRef,
} from './lookup-keys.types';

// =============================================================================
// DEFAULT VALUES AND CONSTANTS
// =============================================================================

/**
 * Default configuration values for consistent component behavior
 * Provides sensible defaults for all lookup keys configuration options
 */
export {
  DEFAULT_LOOKUP_KEY_ENTRY,
  DEFAULT_LOOKUP_KEYS_STYLING,
  DEFAULT_LOOKUP_KEYS_ACCESSIBILITY,
  DEFAULT_LOOKUP_KEYS_LABELS,
} from './lookup-keys.types';

// =============================================================================
// CONVENIENCE RE-EXPORTS AND COLLECTIONS
// =============================================================================

/**
 * Complete lookup keys component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { LookupKeysComponents } from '@/components/ui/lookup-keys';
 * 
 * // Access main component through the collection
 * const { LookupKeys } = LookupKeysComponents;
 * ```
 */
export const LookupKeysComponents = {
  LookupKeys,
} as const;

/**
 * Lookup keys utilities collection for bulk imports
 * Provides access to all validation schemas, type guards, and utility functions
 * 
 * @example
 * ```tsx
 * import { LookupKeysUtils } from '@/components/ui/lookup-keys';
 * 
 * // Access utilities through the collection
 * const isValid = LookupKeysUtils.isLookupKeyEntry(data);
 * const validation = LookupKeysUtils.lookupKeySchema.parse(entry);
 * ```
 */
export const LookupKeysUtils = {
  lookupKeySchema,
  lookupKeysArraySchema,
  isLookupKeyEntry,
  isLookupKeyEntryArray,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for lookup keys system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface LookupKeysSystemTypes {
  LookupKeysProps: LookupKeysProps;
  LookupKeyEntry: LookupKeyEntry;
  LookupKeyCreatePayload: LookupKeyCreatePayload;
  LookupKeyUpdatePayload: LookupKeyUpdatePayload;
  LookupKeysFormValues: LookupKeysFormValues;
  LookupKeysFieldArrayConfig: LookupKeysFieldArrayConfig;
  LookupKeysFieldArrayReturn: LookupKeysFieldArrayReturn;
  LookupKeysStyling: LookupKeysStyling;
  LookupKeysAccessibility: LookupKeysAccessibility;
  LookupKeysEventHandlers: LookupKeysEventHandlers;
  LookupKeysValidationErrors: LookupKeysValidationErrors;
  LookupKeysRef: LookupKeysRef;
}

/**
 * Lookup keys layout variant type union for dynamic component creation
 * Useful for configuration-driven component rendering
 */
export type LookupKeysVariant = 'table' | 'accordion' | 'cards';

/**
 * Lookup keys size type union for dynamic sizing
 */
export type LookupKeysSizeOption = 'sm' | 'md' | 'lg';

/**
 * Lookup keys color variant type for design system integration
 */
export type LookupKeysColor = 'default' | 'primary' | 'secondary';

// =============================================================================
// ACCESSIBILITY CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for lookup keys system
 * Provides reference values for accessibility validation and testing
 */
export const LOOKUP_KEYS_ACCESSIBILITY_CONSTANTS = {
  /**
   * Minimum touch target size per WCAG guidelines
   */
  MIN_TOUCH_TARGET: {
    width: 44,
    height: 44,
  },
  
  /**
   * Keyboard navigation key mappings
   */
  KEYBOARD_SHORTCUTS: {
    addEntry: 'KeyA',
    removeEntry: 'Delete',
    navigateUp: 'ArrowUp',
    navigateDown: 'ArrowDown',
    togglePrivacy: 'KeyP',
    focusName: 'KeyN',
    focusValue: 'KeyV',
  },
  
  /**
   * ARIA live region settings for dynamic content updates
   */
  ARIA_LIVE: {
    polite: 'polite' as const,
    assertive: 'assertive' as const,
    off: 'off' as const,
  },
  
  /**
   * Focus management timing for smooth transitions
   */
  FOCUS_TIMING: {
    delay: 100, // milliseconds for focus transitions
    announcement: 1000, // milliseconds for screen reader announcements
  },
  
  /**
   * Error message display timing
   */
  ERROR_TIMING: {
    display: 150, // milliseconds for error appearance
    clear: 3000, // milliseconds before auto-clearing non-critical errors
  },
} as const;

/**
 * Default lookup keys configuration for consistent application defaults
 */
export const DEFAULT_LOOKUP_KEYS_CONFIG = {
  showAccordion: true,
  enablePrivacyToggle: true,
  allowEmpty: false,
  maxEntries: 100,
  minEntries: 0,
  enableValidation: true,
  enableKeyboardShortcuts: true,
  variant: 'table' as LookupKeysVariant,
  size: 'md' as LookupKeysSizeOption,
  colorVariant: 'default' as LookupKeysColor,
} as const;

/**
 * Validation configuration constants
 */
export const LOOKUP_KEYS_VALIDATION_CONFIG = {
  /**
   * Field validation constraints
   */
  CONSTRAINTS: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 255,
    VALUE_MAX_LENGTH: 65535,
    NAME_PATTERN: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  },
  
  /**
   * Validation error message keys for internationalization
   */
  ERROR_KEYS: {
    REQUIRED: 'validation.required',
    DUPLICATE_NAME: 'validation.duplicateName',
    INVALID_NAME_FORMAT: 'validation.invalidNameFormat',
    NAME_TOO_LONG: 'validation.nameTooLong',
    VALUE_TOO_LONG: 'validation.valueTooLong',
    MAX_ENTRIES_EXCEEDED: 'validation.maxEntriesExceeded',
  },
} as const;