/**
 * Select Components Barrel Export - DreamFactory Admin Interface
 * 
 * Centralized export file providing clean imports for all select component variants
 * including Select, Autocomplete, MultiSelect components with their TypeScript types,
 * custom React hooks, and utility functions. Enables tree-shaking optimization
 * and clean import patterns for React 19/Next.js 15.1+ implementations.
 * 
 * Replaces Angular Material mat-select imports with modern React component library
 * pattern supporting TypeScript 5.8+ strict type safety and Headless UI 2.0+
 * accessibility compliance.
 * 
 * @fileoverview Barrel export for select component library
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * 
 * @example Clean import patterns enabled by this barrel export:
 * ```tsx
 * // Import components
 * import { Select, Autocomplete, MultiSelect } from '@/components/ui/select';
 * 
 * // Import types
 * import type { SelectOption, SelectProps, AutocompleteProps } from '@/components/ui/select';
 * 
 * // Import hooks
 * import { useSelect, useAutocomplete, useMultiSelect } from '@/components/ui/select';
 * 
 * // Import utilities
 * import { useVerbTransform, useSelectKeyboard } from '@/components/ui/select';
 * ```
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

// Main Select component (single selection)
export { default as Select, Select, type SelectComponentProps } from './Select';

// Autocomplete component (searchable single selection)
export { default as Autocomplete, Autocomplete, type AutocompleteComponentProps } from './Autocomplete';

// MultiSelect component (multiple selection with chips)
export { default as MultiSelect, MultiSelect } from './MultiSelect';

// ============================================================================
// TYPE EXPORTS - Core Interfaces
// ============================================================================

export type {
  // Core option and props types
  SelectOption,
  OptionMetadata,
  SelectProps,
  AutocompleteProps,
  MultiSelectProps,
  
  // Value transformation types
  ValueTransformType,
  ValueTransformation,
  BitmaskConfig,
  
  // Theme and styling types
  SelectThemeVariants,
  SelectStyleConfig,
  
  // State management types
  SelectLoadingState,
  SelectErrorState,
  
  // Event handler types
  SelectEventHandlers,
  
  // Utility types
  SelectConfig,
  SelectOptionGroup,
  VirtualScrollConfig,
} from './types';

// ============================================================================
// TYPE EXPORTS - Specialized Select Types
// ============================================================================

export type {
  // Database-specific select types
  DatabaseServiceSelectProps,
  SchemaFieldSelectProps,
  ApiMethodSelectProps,
} from './types';

// ============================================================================
// HOOK EXPORTS - Core Selection Logic
// ============================================================================

export {
  // Primary selection hooks
  useSelect,
  useAutocomplete,
  useMultiSelect,
  
  // Option management and processing
  useSelectOptions,
  
  // Keyboard navigation
  useSelectKeyboard,
  
  // Form integration and validation
  useSelectValidation,
  
  // Advanced selection patterns
  useAdvancedSelect,
  
  // State management utilities
  useSelectState,
} from './hooks';

// ============================================================================
// HOOK EXPORTS - Specialized Functionality
// ============================================================================

export {
  // HTTP verb bitmask transformations (replaces Angular df-verb-picker)
  useVerbTransform,
} from './hooks';

// ============================================================================
// HOOK RETURN TYPE EXPORTS
// ============================================================================

export type {
  // Hook return types for TypeScript strict mode
  UseSelectReturn,
  UseAutocompleteReturn,
  UseMultiSelectReturn,
  UseSelectOptionsReturn,
  UseSelectKeyboardReturn,
  UseSelectValidationReturn,
} from './hooks';

// ============================================================================
// COMPONENT TYPE AGGREGATIONS FOR CONVENIENCE
// ============================================================================

/**
 * Union type of all available select component types
 * Useful for generic implementations and type guards
 */
export type AnySelectComponent = 
  | typeof Select
  | typeof Autocomplete 
  | typeof MultiSelect;

/**
 * Union type of all select component props
 * Useful for higher-order components and wrappers
 */
export type AnySelectProps<T = any> = 
  | SelectProps<T>
  | AutocompleteProps<T>
  | MultiSelectProps<T>;

/**
 * Union type for select values (single or multiple)
 * Handles both single selection and multi-selection value types
 */
export type SelectValue<T = string | number> = T | T[] | undefined;

// ============================================================================
// UTILITY FUNCTION EXPORTS
// ============================================================================

/**
 * Re-export utility functions from hooks for direct access
 * These are commonly used functions extracted for standalone usage
 */

// Option filtering utilities
export { useSelectOptions as createSelectOptions } from './hooks';

// Keyboard navigation utilities  
export { useSelectKeyboard as createKeyboardNavigation } from './hooks';

// Value transformation utilities
export { useVerbTransform as createVerbTransform } from './hooks';

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

/**
 * Default configuration constants for select components
 * Provides sensible defaults for common use cases
 */
export const SELECT_DEFAULTS = {
  // Search configuration
  SEARCH_DEBOUNCE: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_DISPLAY_OPTIONS: 1000,
  
  // Virtual scrolling thresholds
  VIRTUAL_SCROLL_THRESHOLD: 100,
  VIRTUAL_ITEM_HEIGHT: 48,
  VIRTUAL_OVERSCAN: 5,
  
  // Multi-select limits
  MAX_CHIPS_DISPLAYED: 3,
  DEFAULT_MAX_SELECTIONS: 50,
  
  // Component sizes
  SIZES: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
  
  // Component variants
  VARIANTS: ['default', 'outline', 'filled', 'ghost'] as const,
  
  // Loading states
  LOADING_SKELETON_COUNT: 3,
  
  // HTTP verb bitmasks (for API generation)
  HTTP_VERBS: {
    GET: 1,      // 2^0
    POST: 2,     // 2^1  
    PUT: 4,      // 2^2
    PATCH: 8,    // 2^3
    DELETE: 16,  // 2^4
    HEAD: 32,    // 2^5
    OPTIONS: 64, // 2^6
  } as const,
} as const;

/**
 * Database service type constants for specialized selects
 * Used in database connection configuration components
 */
export const DATABASE_SERVICE_TYPES = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql', 
  MONGODB: 'mongodb',
  SQLSERVER: 'sqlserver',
  ORACLE: 'oracle',
  SNOWFLAKE: 'snowflake',
  SQLITE: 'sqlite',
} as const;

/**
 * Common field data types for schema field selects
 * Used in database schema management components
 */
export const FIELD_DATA_TYPES = {
  STRING: 'string',
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  TEXT: 'text',
  JSON: 'json',
  BINARY: 'binary',
} as const;

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy compatibility exports for Angular migration
 * These maintain compatibility with existing DreamFactory patterns
 * while transitioning to React component architecture
 */

// Legacy naming compatibility
export { Select as DfSelect } from './Select';
export { Autocomplete as DfAutocomplete } from './Autocomplete'; 
export { MultiSelect as DfMultiSelect } from './MultiSelect';

// Legacy hook naming for gradual migration
export { useSelect as useDfSelect } from './hooks';
export { useMultiSelect as useDfMultiSelect } from './hooks';
export { useVerbTransform as useDfVerbPicker } from './hooks';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export provides the main Select component for simple imports
 * Supports both named and default import patterns
 */
export { default } from './Select';

// ============================================================================
// TYPE-ONLY EXPORTS FOR STRICT TYPESCRIPT
// ============================================================================

/**
 * Additional type-only exports for strict TypeScript configurations
 * These ensure proper type inference and prevent runtime imports
 */
export type { ComponentType, ReactNode, KeyboardEvent, FocusEvent } from 'react';
export type { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  FormFieldComponent,
  LoadingState,
  ComponentState,
  ComponentIntent 
} from '../../../types/ui';