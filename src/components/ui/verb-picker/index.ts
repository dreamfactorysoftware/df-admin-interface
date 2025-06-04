/**
 * VerbPicker Component Barrel Export
 * 
 * Provides centralized access to the VerbPicker component library for HTTP verb selection
 * in API endpoint configuration workflows. Supports single/multiple selection modes,
 * bitmask operations, and React Hook Form integration following React 19 patterns.
 * 
 * Usage Examples:
 * 
 * // Basic single verb selection
 * import { VerbPicker } from '@/components/ui/verb-picker'
 * <VerbPicker mode="single" value="GET" onChange={handleVerbChange} />
 * 
 * // Multiple verb selection with bitmask
 * import { VerbPicker, useVerbTransform } from '@/components/ui/verb-picker'
 * const { toBitmask, fromBitmask } = useVerbTransform()
 * 
 * // With React Hook Form integration
 * import { VerbPicker, type VerbPickerProps } from '@/components/ui/verb-picker'
 * <VerbPicker {...register('httpMethods')} mode="multiple" />
 * 
 * @version 1.0.0
 * @since React 19, Next.js 15.1
 */

// ===== MAIN COMPONENT EXPORTS =====

/**
 * Primary VerbPicker component for HTTP verb selection
 * Supports single/multiple selection modes with full accessibility compliance
 */
export { VerbPicker } from './VerbPicker'

/**
 * Default export for convenient importing
 * Enables: import VerbPicker from '@/components/ui/verb-picker'
 */
export { VerbPicker as default } from './VerbPicker'

// ===== TYPE DEFINITIONS =====

/**
 * Core TypeScript interfaces and type definitions
 * Exported as both value and type-only exports for optimal tree-shaking
 */
export type {
  VerbPickerProps,
  VerbPickerRef,
  VerbSelectionMode,
  VerbDisplayVariant,
  VerbPickerSize,
} from './types'

export type {
  HttpVerb,
  VerbOption,
  VerbConfig,
  VerbBitmask,
  VerbMetadata,
} from './types'

export type {
  VerbPickerChangeEvent,
  VerbPickerValidationResult,
  VerbPickerErrorType,
} from './types'

// Value exports for runtime access
export type { 
  HttpVerbArray,
  VerbPickerTheme,
  VerbPickerLocalization 
} from './types'

// ===== CUSTOM HOOKS =====

/**
 * React hooks for verb selection logic and state management
 * Optimized for React 19 concurrent features and server components
 */

/**
 * Primary hook for verb picker state management and validation
 * Provides controlled/uncontrolled component support with React Hook Form integration
 */
export { useVerbPicker } from './hooks'

/**
 * Utility hook for verb value transformations and bitmask operations
 * Enables conversion between arrays, bitmasks, and individual values
 */
export { useVerbTransform } from './hooks'

/**
 * Hook for verb picker accessibility features and keyboard navigation
 * Ensures WCAG 2.1 AA compliance with screen reader support
 */
export { useVerbAccessibility } from './hooks'

/**
 * Hook for verb picker validation with Zod schema integration
 * Provides real-time validation with React Hook Form compatibility
 */
export { useVerbValidation } from './hooks'

// ===== UTILITY FUNCTIONS =====

/**
 * Standalone utility functions for verb operations and transformations
 * Pure functions optimized for tree-shaking and server-side compatibility
 */

/**
 * Bitmask conversion utilities for efficient verb storage and comparison
 */
export {
  verbsToBitmask,
  bitmaskToVerbs,
  isBitmaskValid,
  combineBitmasks,
  subtractBitmasks,
} from './utils'

/**
 * Verb validation and formatting utilities
 */
export {
  isValidHttpVerb,
  normalizeVerb,
  getVerbMetadata,
  sortVerbsByPriority,
  filterVerbsByContext,
} from './utils'

/**
 * Localization and display utilities
 */
export {
  getVerbDisplayName,
  getVerbDescription,
  getVerbIcon,
  formatVerbList,
} from './utils'

/**
 * React Hook Form specific utilities
 */
export {
  createVerbPickerController,
  validateVerbSelection,
  transformVerbFormValue,
} from './utils'

// ===== CONSTANTS =====

/**
 * Static configuration constants and default values
 * Exported for consistent behavior across implementations
 */

/**
 * Standard HTTP verbs supported by the picker
 * Array of all valid HTTP methods for API endpoint configuration
 */
export { HTTP_VERBS } from './types'

/**
 * Default verb configurations for common use cases
 * Pre-configured settings for REST API, webhooks, and custom endpoints
 */
export { 
  DEFAULT_REST_VERBS,
  DEFAULT_WEBHOOK_VERBS,
  DEFAULT_CRUD_VERBS,
  VERB_PICKER_DEFAULTS,
} from './types'

/**
 * Bitmask constants for efficient verb operations
 * Numeric values for each HTTP verb for bitwise operations
 */
export {
  VERB_BITMASKS,
  ALL_VERBS_BITMASK,
  READ_ONLY_VERBS_BITMASK,
  WRITE_VERBS_BITMASK,
} from './types'

// ===== COMPONENT VARIANTS =====

/**
 * Specialized verb picker variants for specific use cases
 * Pre-configured components with domain-specific behavior
 */

/**
 * REST API specific verb picker with common REST operations
 * Pre-configured for typical CRUD endpoint configuration
 */
export { RestVerbPicker } from './VerbPicker'

/**
 * Security-focused verb picker with access control integration
 * Includes role-based verb filtering and permission validation
 */
export { SecureVerbPicker } from './VerbPicker'

/**
 * Compact verb picker for space-constrained interfaces
 * Minimal UI variant with essential functionality only
 */
export { CompactVerbPicker } from './VerbPicker'

// ===== ADVANCED EXPORTS =====

/**
 * Advanced functionality for complex use cases and customization
 * Lower-level APIs for building custom verb selection interfaces
 */

/**
 * Context providers for verb picker theme and configuration
 * Enables application-wide verb picker customization
 */
export {
  VerbPickerProvider,
  useVerbPickerContext,
  VerbPickerThemeProvider,
} from './VerbPicker'

/**
 * Builder pattern utilities for dynamic verb picker configuration
 * Programmatic construction of verb picker instances
 */
export {
  VerbPickerBuilder,
  createVerbPickerConfig,
  mergeVerbPickerConfigs,
} from './utils'

/**
 * Testing utilities for component testing and development
 * Mock implementations and test helpers for Vitest/Jest
 */
export {
  mockVerbPickerProps,
  createVerbPickerTestProps,
  verbPickerTestIds,
} from './utils'

// ===== RE-EXPORTS FOR CONVENIENCE =====

/**
 * Common re-exports from related components for convenience
 * Reduces import complexity for common usage patterns
 */

// Form integration utilities
export type { FieldPath, FieldValues } from 'react-hook-form'

// Headless UI re-exports for custom implementations
export { Listbox } from '@headlessui/react'

// Icon components for verb display
export { 
  CheckIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/20/solid'

// ===== MODULE METADATA =====

/**
 * Module version and compatibility information
 * Useful for debugging and development tools
 */
export const VERB_PICKER_VERSION = '1.0.0'
export const REACT_VERSION_REQUIRED = '19.0.0'
export const NEXTJS_VERSION_REQUIRED = '15.1.0'

/**
 * Feature flags for progressive enhancement
 * Enables/disables advanced features based on environment
 */
export const VERB_PICKER_FEATURES = {
  BITMASK_SUPPORT: true,
  ACCESSIBILITY_ENHANCED: true,
  REACT_HOOK_FORM_INTEGRATION: true,
  SERVER_COMPONENT_COMPATIBLE: true,
  VITEST_OPTIMIZED: true,
} as const

/**
 * Performance optimization exports
 * Lazy-loaded components and code-splitting utilities
 */
export const VerbPickerLazy = () => import('./VerbPicker').then(m => ({ default: m.VerbPicker }))

/**
 * Development mode exports for debugging and development tools
 * Only available in development builds for bundle optimization
 */
if (process.env.NODE_ENV === 'development') {
  // Development-only exports for debugging
  export { verbPickerDebugUtils } from './utils'
  export { VerbPickerDevTools } from './VerbPicker'
}