/**
 * Toggle Component System - Barrel Export
 * 
 * Provides centralized imports for Toggle components and utilities following
 * React 19/Next.js 15.1 conventions. Exports the main Toggle component,
 * variant utilities, and TypeScript type definitions for clean consumption
 * across the application.
 * 
 * @example Basic usage:
 * ```tsx
 * import { Toggle } from '@/components/ui/toggle'
 * 
 * function SettingsForm() {
 *   const [enabled, setEnabled] = useState(false)
 *   return (
 *     <Toggle
 *       checked={enabled}
 *       onChange={setEnabled}
 *       label="Enable notifications"
 *     />
 *   )
 * }
 * ```
 * 
 * @example With variants:
 * ```tsx
 * import { Toggle, toggleVariants, type ToggleProps } from '@/components/ui/toggle'
 * 
 * function CustomToggle(props: ToggleProps) {
 *   return (
 *     <Toggle
 *       {...props}
 *       size="lg"
 *       variant="success"
 *       className={toggleVariants({ size: 'lg', variant: 'success' })}
 *     />
 *   )
 * }
 * ```
 */

// Export main Toggle component as both default and named export
// for maximum compatibility with React 19/Next.js 15.1 patterns
export { default as Toggle } from './toggle'
export { Toggle as default } from './toggle'

// Export variant utilities and styling configurations from toggle-variants.ts
// These provide class-variance-authority (cva) based styling management
export {
  toggleVariants,
  type ToggleVariants,
  type ToggleSize,
  type ToggleVariant,
  type ToggleLabelPosition,
} from './toggle-variants'

// Export TypeScript type definitions for component props and toggle states
// Ensures type safety throughout the application
export type {
  ToggleProps,
  ToggleRef,
  ToggleChangeHandler,
  ToggleState,
  ToggleValue,
} from './toggle'

// Re-export common utility types for toggle state management
// These support controlled and uncontrolled component patterns
export type {
  // Base toggle state interface
  ToggleStateManager,
  // Event handler types
  ToggleEventHandler,
  ToggleChangeEvent,
  // Form integration types
  ToggleFormValue,
  ToggleValidationState,
} from './toggle'

// Export utility functions for toggle state management
// These provide helpers for common toggle state operations
export {
  // Toggle state utilities
  createToggleState,
  useToggleState,
  // Form integration helpers
  createToggleController,
  validateToggleValue,
} from './toggle'

// Export accessibility helpers for enhanced WCAG 2.1 AA compliance
export {
  // ARIA attribute generators
  getToggleAriaProps,
  getToggleLabelProps,
  // Accessibility validation
  validateToggleAccessibility,
} from './toggle'

// Export Headless UI component re-exports for advanced use cases
// Provides access to underlying Switch primitives when needed
export type {
  SwitchProps as HeadlessSwitchProps,
} from '@headlessui/react'

/**
 * Component feature exports for tree-shaking optimization
 * Each feature can be imported individually to minimize bundle size
 */

// Size variant utilities
export {
  TOGGLE_SIZES,
  DEFAULT_TOGGLE_SIZE,
  getToggleSizeClasses,
} from './toggle-variants'

// Color variant utilities  
export {
  TOGGLE_VARIANTS,
  DEFAULT_TOGGLE_VARIANT,
  getToggleVariantClasses,
} from './toggle-variants'

// Label positioning utilities
export {
  TOGGLE_LABEL_POSITIONS,
  DEFAULT_LABEL_POSITION,
  getLabelPositionClasses,
} from './toggle-variants'

// State-specific styling utilities
export {
  getToggleStateClasses,
  getDisabledToggleClasses,
  getLoadingToggleClasses,
  getFocusToggleClasses,
} from './toggle-variants'

/**
 * Integration helpers for common usage patterns
 */

// React Hook Form integration utilities
export {
  createToggleFieldController,
  useToggleField,
  type ToggleFieldProps,
} from './toggle'

// Form library compatibility
export {
  createFormikToggleField,
  createZodToggleSchema,
  type ToggleSchemaOptions,
} from './toggle'

/**
 * Development and debugging utilities
 * Available only in development mode
 */
if (process.env.NODE_ENV === 'development') {
  // Development-only exports for debugging and testing
  export {
    __ToggleDebugInfo,
    __validateToggleProps,
    __getToggleDisplayName,
  } from './toggle'
}