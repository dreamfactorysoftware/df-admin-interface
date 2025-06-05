/**
 * Button Component System - Main Export File
 * 
 * Centralizes all button-related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular Material button components.
 * 
 * This barrel export provides clean imports for:
 * - Button component (primary interactive element)
 * - IconButton component (icon-only interactions)
 * - ButtonGroup component (grouped button layouts)
 * - Button variant utilities and type definitions
 * - Accessibility and styling utilities
 * 
 * Features:
 * - WCAG 2.1 AA compliant button components
 * - TypeScript 5.8+ type safety throughout
 * - Tailwind CSS 4.1+ design system integration
 * - Comprehensive accessibility features
 * - Loading states and async operation support
 * - Keyboard navigation and focus management
 * 
 * @example
 * ```tsx
 * // Import the primary Button component
 * import { Button } from '@/components/ui/button';
 * 
 * // Import specific components
 * import { IconButton, ButtonGroup } from '@/components/ui/button';
 * 
 * // Import utilities and types
 * import { buttonVariants, type ButtonProps } from '@/components/ui/button';
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES  
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY BUTTON COMPONENT EXPORTS
// =============================================================================

/**
 * Main Button component - Primary export for all button interactions
 * 
 * Replaces Angular Material mat-button, mat-flat-button, mat-stroked-button
 * with comprehensive React 19 implementation featuring:
 * - WCAG 2.1 AA accessibility compliance
 * - Loading states for async operations
 * - Icon support (left and right positioning)
 * - Multiple variants (primary, secondary, success, warning, error, outline, ghost, link)
 * - Size variants with WCAG touch target compliance
 * - Enhanced keyboard navigation and screen reader support
 */
export { 
  Button as default,
  Button,
  LoadingButton,
} from './button';

/**
 * Button component prop interfaces and types
 * Provides comprehensive TypeScript support for all button configurations
 */
export type { 
  ButtonProps,
  IconButtonProps as ButtonIconProps,
  LoadingButtonProps,
} from './button';

// =============================================================================
// ICON BUTTON COMPONENT EXPORTS  
// =============================================================================

/**
 * IconButton component for icon-only button interactions
 * 
 * Replaces Angular Material mat-icon-button and mat-mini-fab with:
 * - Lucide React icon integration
 * - Circular and square shape variants
 * - Floating Action Button (FAB) support
 * - Enhanced accessibility with required aria-label
 * - Tooltip support for improved UX
 * - Loading states with spinner replacement
 */
export { 
  IconButton,
  iconButtonVariants,
} from './icon-button';

/**
 * IconButton prop interfaces and utilities
 */
export type { 
  IconButtonProps,
} from './icon-button';

// =============================================================================
// BUTTON GROUP COMPONENT EXPORTS
// =============================================================================

/**
 * ButtonGroup component for organizing related buttons
 * 
 * Provides visual grouping and keyboard navigation for:
 * - Dialog action buttons (Cancel/Save combinations)
 * - Form submission groups
 * - Toolbar button collections
 * - Multi-action button sets
 * 
 * Features:
 * - Horizontal and vertical orientation support
 * - Arrow key navigation between grouped buttons
 * - ARIA group labeling for screen readers
 * - Attached and separated visual variants
 * - Consistent spacing following design system
 */
export { 
  ButtonGroup,
  useButtonGroup,
} from './button-group';

/**
 * ButtonGroup prop interfaces and utilities
 */
export type { 
  ButtonGroupProps,
} from './button-group';

// =============================================================================
// BUTTON VARIANT UTILITIES AND TYPES
// =============================================================================

/**
 * Button styling variants and utility functions
 * 
 * Provides comprehensive styling system with:
 * - WCAG 2.1 AA compliant color combinations
 * - Design token integration via Tailwind CSS
 * - Dynamic class generation with class-variance-authority
 * - Loading state management
 * - Focus ring utilities for keyboard navigation
 * - Size calculations for programmatic layout
 */
export { 
  buttonVariants,
  getButtonClasses,
  getLoadingAriaLabel,
  focusRingClasses,
  buttonSizes,
} from './button-variants';

/**
 * Button variant prop interfaces and type utilities
 * Enables type-safe usage of button styling throughout the application
 */
export type { 
  ButtonVariantProps,
  VariantProps,
} from './button-variants';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * Class-variance-authority type utilities
 * Re-exported for external component composition
 */
export type { VariantProps as CVAVariantProps } from 'class-variance-authority';

// =============================================================================
// COMPONENT COLLECTION EXPORT
// =============================================================================

/**
 * Complete button component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { ButtonComponents } from '@/components/ui/button';
 * 
 * // Access all components through the collection
 * const { Button, IconButton, ButtonGroup } = ButtonComponents;
 * ```
 */
export const ButtonComponents = {
  Button,
  IconButton, 
  ButtonGroup,
  LoadingButton,
} as const;

/**
 * Button utilities collection for bulk imports
 * Provides access to all styling and accessibility utilities
 * 
 * @example
 * ```tsx
 * import { ButtonUtils } from '@/components/ui/button';
 * 
 * // Access utilities through the collection
 * const classes = ButtonUtils.getButtonClasses({
 *   variant: 'primary',
 *   size: 'lg'
 * });
 * ```
 */
export const ButtonUtils = {
  buttonVariants,
  iconButtonVariants,
  getButtonClasses,
  getLoadingAriaLabel,
  focusRingClasses,
  buttonSizes,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for button system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface ButtonSystemTypes {
  ButtonProps: ButtonProps;
  IconButtonProps: IconButtonProps;
  LoadingButtonProps: LoadingButtonProps;
  ButtonGroupProps: ButtonGroupProps;
  ButtonVariantProps: ButtonVariantProps;
}

/**
 * Button variant type union for dynamic component creation
 * Useful for configuration-driven button rendering
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'link';

/**
 * Button size type union for dynamic sizing
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon-sm' | 'icon-md' | 'icon-lg' | 'icon-xl';

/**
 * Button group orientation type for layout control
 */
export type ButtonGroupOrientation = 'horizontal' | 'vertical';

// =============================================================================
// ACCESSIBILITY CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for button system
 * Provides reference values for accessibility validation
 */
export const ACCESSIBILITY_CONSTANTS = {
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
    uiComponents: 3.0,
    enhancedText: 7.0, // AAA level
  },
  
  /**
   * Focus ring specifications
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
    announcement: 1000, // milliseconds for screen reader announcements
  },
} as const;

/**
 * Default button configuration for consistent application defaults
 */
export const DEFAULT_BUTTON_CONFIG = {
  variant: 'primary' as ButtonVariant,
  size: 'md' as ButtonSize,
  loading: false,
  fullWidth: false,
  enableKeyboardNavigation: true,
} as const;