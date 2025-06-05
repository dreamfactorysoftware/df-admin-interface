/**
 * Lookup Keys Component System
 * 
 * Centralized exports for the lookup-keys component system, providing clean imports
 * for the LookupKeys component and related types. Follows React 19/Next.js 15.1 
 * conventions with proper tree-shaking support.
 * 
 * @module src/components/ui/lookup-keys
 */

// Component exports - both default and named for maximum compatibility
export { default as LookupKeys } from './lookup-keys'
export { LookupKeys as LookupKeysComponent } from './lookup-keys'

// Type and interface exports from lookup-keys.types.ts
export type {
  LookupKeyEntry,
  LookupKeysProps,
  LookupKeysFormArrayValues,
  LookupKeysFieldArrayItem,
  LookupKeysValidationSchema,
  LookupKeysThemeProps,
  LookupKeysCallbacks,
  LookupKeysAccessibilityProps,
  LookupKeysLayoutVariant,
  LookupKeysFormError,
  LookupKeysFormFieldProps,
} from './lookup-keys.types'

// Re-export the default component for clean imports
export default from './lookup-keys'

// Utility exports for lookup key management
export { 
  createEmptyLookupKey,
  validateLookupKeyName,
  validateLookupKeyValue,
  lookupKeysSchema,
  getLookupKeysDefaultValues,
  transformLookupKeysForSubmission,
  isValidLookupKeysArray,
} from './lookup-keys.utils'

// React Hook Form integration helpers
export {
  useLookupKeysFieldArray,
  useLookupKeysValidation,
  useLookupKeysAccessibility,
} from './lookup-keys.hooks'

// Constants and configuration
export {
  LOOKUP_KEYS_DEFAULTS,
  LOOKUP_KEYS_VALIDATION_MESSAGES,
  LOOKUP_KEYS_ARIA_LABELS,
  LOOKUP_KEYS_TEST_IDS,
} from './lookup-keys.constants'

// Component composition utilities
export {
  LookupKeysTable,
  LookupKeysAccordion,
  LookupKeysFormField,
  LookupKeysActionButtons,
} from './lookup-keys.components'