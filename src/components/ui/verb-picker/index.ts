/**
 * VerbPicker Component Barrel Export
 * 
 * Centralized export file providing clean imports for the VerbPicker component library.
 * Enables tree-shaking optimization and organized imports following React 19/Next.js 15.1 patterns.
 * 
 * Usage:
 * ```typescript
 * import { VerbPicker, VerbPickerProps, useVerbPicker } from '@/components/ui/verb-picker';
 * import type { HttpVerb, VerbOption } from '@/components/ui/verb-picker';
 * ```
 * 
 * @fileoverview Replaces Angular df-verb-picker module with modern React component exports
 */

// ============================================================================
// Main Component Exports
// ============================================================================

export { default as VerbPicker } from './VerbPicker';

// ============================================================================
// Type-Only Exports for TypeScript Compilation Efficiency
// ============================================================================

// Core component types
export type {
  VerbPickerProps,
  VerbPickerMode,
  VerbPickerAnyValue,
  VerbPickerValue,
} from './types';

// HTTP verb and option types
export type {
  HttpVerb,
  VerbOption,
  VerbPickerEvents,
  VerbPickerKeyboardHandlers,
} from './types';

// Configuration and schema types
export type {
  ConfigSchema,
  ThemeVariant,
  SizeVariant,
  BaseComponent,
  FormControlComponent,
} from './types';

// Value transformation types
export type {
  VerbTransformOptions,
  VerbPickerPropsVariant,
  ConditionalVerbPickerProps,
  ExtractValueType,
} from './types';

// Validation types
export type {
  VerbValidationResult,
  VerbValidator,
} from './types';

// Testing and development types
export type {
  VerbPickerTestProps,
  VerbPickerMockData,
} from './types';

// Hook return types
export type {
  UseVerbPickerReturn,
  UseVerbTransformReturn,
} from './types';

// Re-exported React Hook Form types for convenience
export type {
  FieldPath,
  FieldValues,
  UseControllerProps,
} from './types';

// ============================================================================
// Constants and Enums
// ============================================================================

export { VERB_BITMASKS } from './types';

// ============================================================================
// Custom React Hooks
// ============================================================================

// Core verb picker hooks
export {
  useVerbPicker,
  useVerbTransform,
  useVerbValidation,
  useCompleteVerbPicker,
} from './hooks';

// Utility hooks
export {
  useVerbOptions,
  useVerbKeyboard,
  useThemeMode,
} from './hooks';

// ============================================================================
// Utility Functions
// ============================================================================

// Bitmask conversion utilities
export {
  convertBitmaskToVerbs,
  convertVerbsToBitmask,
  getVerbBitmask,
} from './utils';

// Value transformation utilities
export {
  transformValue,
  getSelectedVerbs,
  formatVerbDisplay,
} from './utils';

// Validation utilities
export {
  validateVerbSelection,
  isValidVerbCombination,
  isVerbSelected,
  toggleVerb,
} from './utils';

// Option generation utilities
export {
  generateVerbOptions,
} from './utils';

// Constants from utils
export {
  HTTP_VERB_BITMASKS,
} from './utils';

// ============================================================================
// Re-exported Utility Types from Utils
// ============================================================================

export type {
  VerbValue,
} from './utils';

// ============================================================================
// Organized Export Groups for Different Use Cases
// ============================================================================

/**
 * Essential exports for basic verb picker usage
 * Import these for standard component implementation
 */
export const VerbPickerEssentials = {
  VerbPicker,
} as const;

/**
 * Hook exports for custom implementations
 * Import these when building custom verb selection logic
 */
export const VerbPickerHooks = {
  useVerbPicker,
  useVerbTransform,
  useVerbValidation,
  useVerbOptions,
  useCompleteVerbPicker,
} as const;

/**
 * Utility exports for value manipulation
 * Import these for bitmask operations and value transformations
 */
export const VerbPickerUtils = {
  convertBitmaskToVerbs,
  convertVerbsToBitmask,
  transformValue,
  getSelectedVerbs,
  validateVerbSelection,
  toggleVerb,
  isVerbSelected,
  generateVerbOptions,
  formatVerbDisplay,
} as const;

/**
 * Constant exports for reference values
 * Import these for bitmask calculations and verb mappings
 */
export const VerbPickerConstants = {
  HTTP_VERB_BITMASKS,
  VERB_BITMASKS,
} as const;

// ============================================================================
// Default Export for Convenience
// ============================================================================

/**
 * Default export providing the main VerbPicker component
 * Enables `import VerbPicker from '@/components/ui/verb-picker'` syntax
 */
export { default } from './VerbPicker';