/**
 * Confirm Dialog Component System - Barrel Export Index
 * 
 * Main export file for the React 19/Next.js 15.1 compatible confirmation dialog
 * component system. Provides clean, centralized imports for all dialog-related
 * functionality, types, and utilities following modern React conventions.
 * 
 * This replaces the Angular DfConfirmDialogComponent system with a comprehensive
 * React-based implementation featuring promise-based workflows, enhanced accessibility,
 * and seamless integration with Next.js middleware and server components.
 * 
 * @version 1.0.0
 * @since 2024
 * @author DreamFactory Platform Team
 */

// =============================================================================
// CORE COMPONENT EXPORTS
// =============================================================================

/**
 * Main ConfirmDialog component with comprehensive accessibility and promise-based workflows
 * 
 * Features:
 * - WCAG 2.1 AA compliant with focus trapping and keyboard navigation
 * - Promise-based API for async confirmation workflows
 * - Headless UI Dialog primitive for accessible modal patterns
 * - Comprehensive internationalization support
 * - Multiple severity levels and customizable themes
 * - Mobile-first responsive design
 * 
 * @example
 * ```tsx
 * import { ConfirmDialog } from '@/components/ui/confirm-dialog';
 * 
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *   
 *   const handleConfirm = async () => {
 *     await deleteResource();
 *   };
 *   
 *   return (
 *     <ConfirmDialog
 *       open={open}
 *       onOpenChange={setOpen}
 *       onConfirm={handleConfirm}
 *       title="Delete Resource"
 *       message="Are you sure you want to delete this resource?"
 *       severity="error"
 *       destructive
 *     />
 *   );
 * }
 * ```
 */
export { ConfirmDialog } from './confirm-dialog';

/**
 * Default export for convenient importing
 * Maintains backward compatibility with existing Angular dialog usage patterns
 * 
 * @example
 * ```tsx
 * import ConfirmDialog from '@/components/ui/confirm-dialog';
 * ```
 */
export { default } from './confirm-dialog';

// =============================================================================
// TYPE DEFINITIONS EXPORTS
// =============================================================================

/**
 * Core interface exports for dialog data and configuration
 * Provides comprehensive typing for all dialog-related functionality
 */
export type {
  // Core dialog interfaces
  ConfirmDialogData,
  ConfirmDialogProps,
  DialogState,
  
  // Configuration interfaces
  DialogAnimationConfig,
  DialogAccessibilityConfig,
  DialogCallbacks,
  
  // Provider and context interfaces for advanced usage
  ConfirmDialogProviderProps,
  ConfirmDialogContextValue,
  
  // Hook interfaces for programmatic dialog management
  UseConfirmDialogReturn,
  
  // Preset interfaces for common dialog patterns
  DialogPresets,
  DialogPresetConfig,
  
  // Enum types for dialog configuration
  DialogSeverity,
  DialogTheme,
  
  // Function types for callback handling
  ConfirmationCallback,
  CancellationCallback,
  
  // Utility types for flexible usage patterns
  PartialDialogData,
  DialogConfig,
  DialogResult,
  DialogEvents,
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Type guard utilities for runtime type checking and validation
 * Provides safe type checking for dialog configuration and state management
 */
export { 
  /**
   * Type guard to check if a value is a valid DialogSeverity
   * 
   * @param value - Value to check
   * @returns True if value is a valid DialogSeverity
   * 
   * @example
   * ```tsx
   * if (isDialogSeverity(userInput)) {
   *   // userInput is now typed as DialogSeverity
   *   setDialogSeverity(userInput);
   * }
   * ```
   */
  isDialogSeverity,
  
  /**
   * Type guard to check if a value is a valid DialogTheme
   * 
   * @param value - Value to check
   * @returns True if value is a valid DialogTheme
   * 
   * @example
   * ```tsx
   * if (isDialogTheme(themeConfig)) {
   *   // themeConfig is now typed as DialogTheme
   *   setDialogTheme(themeConfig);
   * }
   * ```
   */
  isDialogTheme,
} from './types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Re-export all types for comprehensive access
 * Enables both named and bulk imports for flexible consumption patterns
 * 
 * @example
 * ```tsx
 * // Named imports
 * import { ConfirmDialog, ConfirmDialogProps } from '@/components/ui/confirm-dialog';
 * 
 * // Bulk import with alias
 * import * as ConfirmDialogSystem from '@/components/ui/confirm-dialog';
 * ```
 */
export * from './types';

// =============================================================================
// ADVANCED USAGE PATTERNS
// =============================================================================

/**
 * Promise-based confirmation utility types for advanced workflows
 * These types support the migration from Angular's subscription-based patterns
 * to React's promise-based async workflows
 */

/**
 * Configuration type for creating reusable dialog presets
 * Enables standardized dialog configurations across the application
 * 
 * @example
 * ```tsx
 * const deletePreset: DialogPresetConfig = {
 *   confirmText: 'Delete',
 *   destructiveByDefault: true,
 *   defaultTheme: 'default',
 * };
 * ```
 */

/**
 * Event system types for dialog state monitoring and analytics
 * Provides comprehensive event tracking for user interaction patterns
 * 
 * @example
 * ```tsx
 * // Monitor dialog interactions for analytics
 * function trackDialogEvent(event: DialogEvents['dialog:close']) {
 *   analytics.track('dialog_closed', {
 *     id: event.id,
 *     result: event.result,
 *     reason: event.reason,
 *   });
 * }
 * ```
 */

// =============================================================================
// MIGRATION COMPATIBILITY
// =============================================================================

/**
 * Compatibility exports for Angular-to-React migration
 * Maintains naming conventions and interface patterns from the original
 * Angular DfConfirmDialogComponent for easier migration
 * 
 * These exports provide a migration bridge while teams transition
 * from Angular patterns to React patterns
 */

/**
 * @deprecated Use ConfirmDialogData instead. Provided for migration compatibility.
 * This alias maintains compatibility with existing Angular DfConfirmDialogData usage
 */
export type DfConfirmDialogData = ConfirmDialogData;

/**
 * @deprecated Use ConfirmDialogProps instead. Provided for migration compatibility.
 * This alias maintains compatibility with existing Angular component prop patterns
 */
export type DfConfirmDialogProps = ConfirmDialogProps;

// =============================================================================
// DOCUMENTATION AND USAGE NOTES
// =============================================================================

/**
 * @fileoverview
 * 
 * This index file serves as the central export point for the ConfirmDialog
 * component system, providing:
 * 
 * 1. **Clean Component Access**: Simple imports for the main component
 * 2. **Comprehensive Type Safety**: Full TypeScript definitions
 * 3. **Utility Functions**: Type guards and validation helpers
 * 4. **Migration Support**: Compatibility aliases for Angular migration
 * 5. **Advanced Patterns**: Support for complex dialog workflows
 * 
 * The component system has been designed to seamlessly integrate with:
 * - Next.js 15.1+ App Router architecture
 * - React 19 concurrent features and server components
 * - Tailwind CSS 4.1+ utility-first styling
 * - TypeScript 5.8+ enhanced type inference
 * - Vitest 2.1+ testing framework with MSW mocking
 * 
 * For detailed usage examples and API documentation, refer to:
 * - Component documentation: ./confirm-dialog.tsx
 * - Type definitions: ./types.ts
 * - Test examples: ./confirm-dialog.test.tsx
 * 
 * Performance Characteristics:
 * - Tree-shakeable exports for optimal bundle size
 * - Lazy-loaded with React.lazy() support
 * - SSR-compatible with Next.js server components
 * - Minimal runtime overhead with efficient re-renders
 * 
 * Accessibility Features:
 * - WCAG 2.1 AA compliant color contrast ratios
 * - Full keyboard navigation support
 * - Screen reader optimized ARIA attributes
 * - Focus management and trapping
 * - High contrast mode support
 * 
 * Browser Support:
 * - Modern browsers with ES2020+ support
 * - Progressive enhancement for older browsers
 * - Mobile-first responsive design
 * - Touch-friendly interaction targets (44px minimum)
 */