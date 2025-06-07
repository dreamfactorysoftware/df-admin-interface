/**
 * Button Component System - Main Export File
 * 
 * Centralizes all button-related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular Material button components.
 * 
 * This barrel export file provides clean imports for:
 * - Button component with comprehensive variant system
 * - IconButton component for icon-only interactions  
 * - ButtonGroup component for organizing related buttons
 * - FAB (Floating Action Button) for primary actions
 * - Button variant utilities and type definitions
 * - Accessibility helpers and design tokens
 * 
 * Following React 19/Next.js 15.1 conventions with TypeScript 5.8+ type safety.
 * All components implement WCAG 2.1 AA accessibility standards.
 * 
 * @example
 * ```tsx
 * import { Button, IconButton, ButtonGroup } from '@/components/ui/button';
 * import type { ButtonProps, IconButtonProps } from '@/components/ui/button';
 * 
 * // Primary action button
 * <Button variant="primary" size="md">Save Changes</Button>
 * 
 * // Icon-only button with accessibility
 * <IconButton 
 *   icon={<Edit />} 
 *   aria-label="Edit connection"
 *   tooltip="Edit this database connection"
 * />
 * 
 * // Grouped buttons with keyboard navigation
 * <ButtonGroup orientation="horizontal" label="Dialog actions">
 *   <Button variant="outline">Cancel</Button>
 *   <Button variant="primary">Confirm</Button>
 * </ButtonGroup>
 * ```
 */

// Core Button Component - Default and Named Exports
export { Button as default, Button } from './button';
export type { ButtonProps } from './button';

// Specialized IconButton Component System
export { 
  IconButton, 
  FAB, 
  IconButtonGroup,
  iconButtonVariants,
  getIconButtonClasses
} from './icon-button';
export type { 
  IconButtonProps, 
  FABProps, 
  IconButtonGroupProps,
  IconButtonVariantProps
} from './icon-button';

// ButtonGroup Component for Organized Button Collections
export { 
  ButtonGroup, 
  useButtonGroup 
} from './button-group';
export type { ButtonGroupProps } from './button-group';

// Button Variant System and Utilities
export {
  buttonVariants,
  getButtonClasses,
  getLoadingAriaLabel,
  focusRingClasses,
  buttonSizes
} from './button-variants';
export type { 
  ButtonVariantProps,
  VariantProps
} from './button-variants';

// Re-export Button variant types for convenience
export type { ButtonVariant, ButtonSize } from './button';

/**
 * Convenience type exports for common usage patterns
 */
export type ButtonSystemProps = ButtonProps | IconButtonProps | ButtonGroupProps;
export type ButtonSystemVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'link';
export type ButtonSystemSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon-sm' | 'icon-md' | 'icon-lg' | 'icon-xl';

/**
 * Button component presets for common DreamFactory use cases
 * These provide pre-configured button combinations for typical admin interface patterns
 */
export const ButtonPresets = {
  /**
   * Database connection action buttons
   */
  connection: {
    test: { variant: 'outline' as const, children: 'Test Connection' },
    save: { variant: 'primary' as const, children: 'Save Connection' },
    delete: { variant: 'error' as const, children: 'Delete Connection' },
  },
  
  /**
   * Schema management action buttons  
   */
  schema: {
    generate: { variant: 'success' as const, children: 'Generate API' },
    refresh: { variant: 'outline' as const, children: 'Refresh Schema' },
    export: { variant: 'secondary' as const, children: 'Export Schema' },
  },
  
  /**
   * Form submission button patterns
   */
  form: {
    submit: { variant: 'primary' as const, type: 'submit' as const },
    cancel: { variant: 'outline' as const, type: 'button' as const, children: 'Cancel' },
    reset: { variant: 'ghost' as const, type: 'reset' as const, children: 'Reset' },
  },
  
  /**
   * Dialog action button patterns
   */
  dialog: {
    confirm: { variant: 'primary' as const, children: 'Confirm' },
    cancel: { variant: 'outline' as const, children: 'Cancel' },
    delete: { variant: 'error' as const, children: 'Delete' },
    save: { variant: 'success' as const, children: 'Save' },
  },
} as const;

/**
 * Accessibility constants for button implementations
 * Ensures consistent WCAG 2.1 AA compliance across all button components
 */
export const ButtonAccessibility = {
  /**
   * Minimum touch target sizes (44x44px for WCAG compliance)
   */
  minTouchTarget: {
    width: 44,
    height: 44,
  },
  
  /**
   * Focus ring specifications for keyboard navigation
   */
  focusRing: {
    width: 2,
    offset: 2,
    style: 'solid',
  },
  
  /**
   * Color contrast ratios (WCAG 2.1 AA standard)
   */
  contrastRatios: {
    normal: 4.5, // Minimum for normal text
    large: 3.0,  // Minimum for large text (18pt+ or 14pt+ bold)
    aaa: 7.0,    // Enhanced AAA standard
  },
  
  /**
   * Loading state announcements for screen readers
   */
  loadingAnnouncements: {
    generic: 'Loading',
    saving: 'Saving changes',
    testing: 'Testing connection', 
    generating: 'Generating API',
    deleting: 'Deleting item',
  },
} as const;

/**
 * Button animation constants for consistent motion design
 */
export const ButtonAnimations = {
  /**
   * Transition durations in milliseconds
   */
  transitions: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  
  /**
   * Easing functions for smooth interactions
   */
  easing: {
    default: 'ease-in-out',
    entrance: 'ease-out',
    exit: 'ease-in',
  },
  
  /**
   * Active state transformations
   */
  activeTransform: {
    scale: 0.98,
    duration: 150,
  },
} as const;