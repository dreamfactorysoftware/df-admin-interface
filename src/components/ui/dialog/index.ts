/**
 * @fileoverview Dialog Component System - Barrel Export Module
 * 
 * Provides clean imports for the comprehensive dialog component system migrated from Angular Material
 * to React 19/Next.js 15.1 with TypeScript 5.8+ support. This barrel export enables centralized
 * access to all dialog-related components, utilities, and type definitions throughout the application.
 * 
 * Migration Context:
 * - Replaces Angular Material MatDialog with React 19 compound component architecture
 * - Implements WCAG 2.1 AA accessibility compliance per Section 7.7.1
 * - Supports mobile-first responsive design per Section 7.7.3
 * - Integrates with Tailwind CSS 4.1+ animation system per Section 7.1.1
 * - Provides Next.js 15.1 app router compatibility
 * 
 * Key Features:
 * - Compound component pattern for flexible composition
 * - Multiple dialog variants (modal, sheet, overlay, drawer)
 * - Promise-based async dialog workflows
 * - Responsive design with mobile-first approach
 * - Comprehensive TypeScript type safety
 * - Accessibility-first implementation
 * - Smooth animations and transitions
 * - Focus management and keyboard navigation
 * 
 * Usage Examples:
 * ```tsx
 * // Basic dialog usage
 * import { Dialog, useDialog } from '@/components/ui/dialog';
 * 
 * function MyComponent() {
 *   const { open, openDialog, closeDialog } = useDialog();
 *   
 *   return (
 *     <Dialog open={open} onOpenChange={setOpen}>
 *       <Dialog.Header>
 *         <Dialog.Title>Confirm Action</Dialog.Title>
 *         <Dialog.Description>Are you sure you want to continue?</Dialog.Description>
 *       </Dialog.Header>
 *       <Dialog.Content>
 *         <p>This action cannot be undone.</p>
 *       </Dialog.Content>
 *       <Dialog.Footer>
 *         <Dialog.Close>Cancel</Dialog.Close>
 *         <Button onClick={handleConfirm}>Confirm</Button>
 *       </Dialog.Footer>
 *     </Dialog>
 *   );
 * }
 * ```
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main Dialog Component with Compound Component Architecture
 * 
 * The Dialog component serves as the root container for modal dialogs, providing
 * state management, accessibility features, and responsive behavior. Uses React 19's
 * enhanced concurrent features for optimal performance.
 * 
 * Features:
 * - Multiple variants: modal, sheet, overlay, drawer
 * - Responsive behavior with mobile-first approach
 * - WCAG 2.1 AA compliant focus management
 * - Smooth animations with Tailwind CSS integration
 * - Promise-based async workflows
 * 
 * @example
 * ```tsx
 * <Dialog open={isOpen} onOpenChange={setIsOpen} variant="modal" size="lg">
 *   <Dialog.Header>
 *     <Dialog.Title>Database Connection</Dialog.Title>
 *   </Dialog.Header>
 *   <Dialog.Content>
 *     <DatabaseConnectionForm />
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export { Dialog as default, Dialog } from './dialog';

/**
 * Dialog Compound Components
 * 
 * These components provide semantic structure for dialog content and are designed
 * to work together as part of the compound component pattern. Each component
 * automatically receives context from the parent Dialog component.
 */

/**
 * Dialog.Content - Main content container
 * 
 * Provides the primary content area with proper styling, scroll behavior,
 * and accessibility attributes. Supports responsive padding and maximum height
 * constraints for optimal user experience across devices.
 * 
 * @example
 * ```tsx
 * <Dialog.Content scrollable maxHeight="400px" padding="lg">
 *   <DatabaseSchemaViewer tables={tables} />
 * </Dialog.Content>
 * ```
 */
export { DialogContent as Content } from './dialog';

/**
 * Dialog.Header - Header container with title and close button
 * 
 * Provides consistent header styling with optional close button and separator.
 * Automatically handles accessibility labeling through dialog context and
 * supports sticky positioning for long dialog content.
 * 
 * @example
 * ```tsx
 * <Dialog.Header showCloseButton sticky>
 *   <Dialog.Title>Create Database Service</Dialog.Title>
 *   <Dialog.Description>Configure your database connection settings</Dialog.Description>
 * </Dialog.Header>
 * ```
 */
export { DialogHeader as Header } from './dialog';

/**
 * Dialog.Footer - Action button container
 * 
 * Provides consistent footer styling with flexible alignment options and
 * responsive button ordering. Supports sticky positioning and mobile-optimized
 * button layouts per WCAG touch target requirements.
 * 
 * @example
 * ```tsx
 * <Dialog.Footer align="right" sticky reverseOnMobile>
 *   <Dialog.Close variant="outline">Cancel</Dialog.Close>
 *   <Button variant="primary" onClick={handleSave}>Save Configuration</Button>
 * </Dialog.Footer>
 * ```
 */
export { DialogFooter as Footer } from './dialog';

/**
 * Dialog.Title - Semantic title component
 * 
 * Provides proper heading hierarchy and accessibility labeling for dialog titles.
 * Automatically integrates with ARIA attributes for screen reader support and
 * supports visual sizing independent of semantic level.
 * 
 * @example
 * ```tsx
 * <Dialog.Title level={2} visualLevel={1}>
 *   Database Connection Test Results
 * </Dialog.Title>
 * ```
 */
export { DialogTitle as Title } from './dialog';

/**
 * Dialog.Description - Accessible description component
 * 
 * Provides semantic description text that's automatically linked to the dialog
 * through ARIA attributes. Essential for screen reader accessibility and
 * comprehensive dialog context.
 * 
 * @example
 * ```tsx
 * <Dialog.Description size="md">
 *   Testing connection to your database may take a few moments. 
 *   Please ensure your database is accessible and credentials are correct.
 * </Dialog.Description>
 * ```
 */
export { DialogDescription as Description } from './dialog';

/**
 * Dialog.Close - Close button component
 * 
 * Provides consistent close button styling and behavior with multiple variants
 * for different use cases. Automatically handles dialog closure and supports
 * custom close handlers for cleanup operations.
 * 
 * @example
 * ```tsx
 * <Dialog.Close 
 *   variant="icon" 
 *   onClose={() => analytics.track('dialog_closed', { source: 'close_button' })}
 *   aria-label="Close database connection dialog"
 * />
 * ```
 */
export { DialogClose as Close } from './dialog';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * useDialog Hook - Dialog State Management
 * 
 * Provides controlled and uncontrolled patterns for dialog state management
 * with TypeScript inference support. Includes utility methods for common
 * dialog operations and integration with React 19's concurrent features.
 * 
 * Features:
 * - Controlled and uncontrolled state patterns
 * - Type-safe dialog props generation
 * - Integration with React 19 concurrent features
 * - Cleanup and memory management
 * 
 * @returns Object containing dialog state and control methods
 * 
 * @example
 * ```tsx
 * function DatabaseServiceList() {
 *   const { open, openDialog, closeDialog, toggleDialog, dialogProps } = useDialog();
 *   
 *   const handleCreateService = () => {
 *     openDialog();
 *   };
 *   
 *   return (
 *     <>
 *       <Button onClick={handleCreateService}>Create New Service</Button>
 *       <Dialog {...dialogProps}>
 *         <CreateServiceForm onComplete={closeDialog} />
 *       </Dialog>
 *     </>
 *   );
 * }
 * ```
 */
export { useDialog } from './dialog';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core Interface Exports
 * 
 * Comprehensive TypeScript interfaces for all dialog components, providing
 * complete type safety and IntelliSense support throughout the application.
 * These interfaces extend HTML element props while adding dialog-specific
 * functionality and accessibility attributes.
 */

/**
 * DialogProps - Main dialog component interface
 * 
 * Comprehensive interface for the root Dialog component including variant
 * configuration, responsive behavior, accessibility options, and animation
 * settings. Extends HTML div props for full DOM compatibility.
 * 
 * Key Properties:
 * - variant: Dialog presentation style (modal, sheet, overlay, drawer)
 * - size: Responsive size configuration (xs, sm, md, lg, xl, full)
 * - position: Dialog positioning (center, top, bottom, left, right)
 * - animation: Custom animation configuration
 * - responsive: Mobile-first responsive behavior settings
 * - Accessibility: Complete WCAG 2.1 AA compliance properties
 */
export type { DialogProps } from './types';

/**
 * Compound Component Interfaces
 * 
 * Type definitions for all compound components within the dialog system,
 * providing specific prop interfaces for each component while maintaining
 * consistency with the overall design system.
 */

/**
 * DialogContentProps - Content container interface
 * Defines props for the main content area including scrolling behavior,
 * padding configuration, and maximum height constraints.
 */
export type { DialogContentProps } from './types';

/**
 * DialogHeaderProps - Header component interface
 * Defines props for dialog headers including close button configuration,
 * alignment options, and sticky positioning behavior.
 */
export type { DialogHeaderProps } from './types';

/**
 * DialogFooterProps - Footer component interface
 * Defines props for dialog footers including button alignment, sticky
 * positioning, and mobile-responsive button ordering.
 */
export type { DialogFooterProps } from './types';

/**
 * DialogTitleProps - Title component interface
 * Defines props for semantic dialog titles including heading levels,
 * visual sizing, and accessibility attributes.
 */
export type { DialogTitleProps } from './types';

/**
 * DialogDescriptionProps - Description component interface
 * Defines props for accessible dialog descriptions including text sizing
 * and semantic content configuration.
 */
export type { DialogDescriptionProps } from './types';

/**
 * DialogCloseProps - Close button interface
 * Defines props for dialog close buttons including variant styling,
 * size options, and custom close handling.
 */
export type { DialogCloseProps } from './types';

/**
 * Context and State Management Types
 * 
 * Type definitions for dialog context and state management, enabling
 * type-safe communication between compound components and consistent
 * state handling across the dialog system.
 */

/**
 * DialogContextType - Context interface for compound components
 * 
 * Defines the context object shared between dialog components, including
 * state management, configuration options, accessibility properties, and
 * responsive behavior settings.
 * 
 * Key Properties:
 * - State: open, loading, error states
 * - Configuration: variant, size, position, animation
 * - Accessibility: ARIA IDs, focus management, keyboard navigation
 * - Responsive: breakpoint detection, mobile/tablet flags
 * - Refs: Component references for imperative operations
 */
export type { DialogContextType } from './types';

/**
 * Enumeration and Union Types
 * 
 * Type-safe enumerations and union types for dialog configuration,
 * providing IntelliSense support and compile-time validation for
 * all dialog options and settings.
 */

/**
 * DialogVariant - Dialog presentation variants
 * Union type defining available dialog presentation styles with
 * responsive behavior and accessibility considerations.
 * 
 * Options:
 * - 'modal': Traditional centered modal dialog
 * - 'sheet': Bottom sheet or side panel presentation
 * - 'overlay': Full-screen overlay with backdrop blur
 * - 'drawer': Sliding drawer from screen edges
 */
export type { DialogVariant } from './types';

/**
 * DialogSize - Responsive size configurations
 * Union type defining size presets with mobile-first responsive
 * behavior and accessibility-compliant minimum dimensions.
 */
export type { DialogSizeType as DialogSize } from './types';

/**
 * DialogPosition - Positioning options
 * Union type defining dialog positioning with responsive adaptation
 * and mobile-optimized presentation modes.
 */
export type { DialogPositionType as DialogPosition } from './types';

/**
 * Advanced Configuration Types
 * 
 * Specialized type definitions for advanced dialog features including
 * animations, responsive behavior, accessibility compliance, and
 * promise-based workflow management.
 */

/**
 * DialogAnimationConfig - Animation configuration interface
 * 
 * Comprehensive interface for dialog animation settings including
 * timing, easing, accessibility considerations, and Tailwind CSS
 * integration for smooth transitions.
 * 
 * Features:
 * - Timing presets and custom duration support
 * - Easing functions including cubic-bezier customization
 * - Reduced motion accessibility compliance
 * - Entry and exit animation configurations
 * - Backdrop animation settings
 */
export type { DialogAnimationConfig } from './types';

/**
 * DialogResponsiveConfig - Responsive behavior interface
 * 
 * Configuration interface for mobile-first responsive dialog behavior
 * including breakpoint-specific sizing, positioning, and mobile
 * optimizations for touch interfaces.
 * 
 * Features:
 * - Breakpoint-specific size and position configuration
 * - Mobile-specific behavior (fullscreen, swipe gestures)
 * - Tablet adaptations for portrait/landscape orientation
 * - Touch target compliance (44px minimum)
 * - Safe area inset handling
 */
export type { DialogResponsiveConfig } from './types';

/**
 * DialogA11yProps - Accessibility configuration interface
 * 
 * Comprehensive WCAG 2.1 AA compliance interface including focus
 * management, keyboard navigation, screen reader support, and
 * live region announcements.
 * 
 * Features:
 * - ARIA attribute configuration
 * - Focus trap and restoration settings
 * - Keyboard navigation options
 * - Screen reader announcements
 * - Accessibility compliance validation
 */
export type { DialogA11yProps } from './types';

/**
 * Promise-Based Workflow Types
 * 
 * Type definitions for asynchronous dialog workflows, enabling
 * promise-based dialog management for complex user interactions
 * and confirmation flows.
 */

/**
 * DialogResult - Promise-based dialog result
 * 
 * Generic interface for dialog resolution results including confirmation
 * status, returned data, closure reason, and timing information for
 * analytics and workflow management.
 * 
 * @template T - Type of data returned from dialog
 */
export type { DialogResult } from './types';

/**
 * ConfirmDialogProps - Confirmation dialog interface
 * 
 * Specialized interface for confirmation dialogs with standardized
 * button configuration, destructive action handling, and async
 * confirmation workflows.
 * 
 * Features:
 * - Customizable confirmation and cancel buttons
 * - Destructive action styling and protection
 * - Async confirmation handling with loading states
 * - Text confirmation requirements for critical actions
 */
export type { ConfirmDialogProps } from './types';

/**
 * PromptDialogProps - Input prompt dialog interface
 * 
 * Specialized interface for input collection dialogs with validation,
 * multiple input types, and form integration support.
 * 
 * Features:
 * - Multiple input types (text, email, password, textarea, etc.)
 * - Built-in validation with custom validators
 * - Async submission handling
 * - Form integration compatibility
 * 
 * @template T - Type of input value collected
 */
export type { PromptDialogProps } from './types';

/**
 * Hook Return Types
 * 
 * Type definitions for dialog hook return values, providing type-safe
 * access to dialog state management and imperative operations.
 */

/**
 * UseDialogReturn - Dialog hook return interface
 * 
 * Interface for the useDialog hook return value including imperative
 * dialog management methods, promise-based workflows, and state
 * inspection utilities.
 * 
 * Features:
 * - Imperative dialog opening with promise resolution
 * - Confirmation and prompt dialog shortcuts
 * - Multiple dialog management
 * - State inspection and control
 */
export type { UseDialogReturn } from './types';

/**
 * UseDialogStateReturn - Dialog state hook return interface
 * 
 * Interface for dialog state management hooks providing controlled
 * and uncontrolled state patterns with TypeScript inference support.
 * 
 * Features:
 * - Boolean state management (open/closed)
 * - State manipulation methods
 * - Integration with React 19 concurrent features
 */
export type { UseDialogStateReturn } from './types';

/**
 * Component Ref Types
 * 
 * React 19 compatible ref types for all dialog components, enabling
 * imperative operations and DOM access when necessary.
 */

/**
 * DialogRef - Main dialog component ref
 * ElementRef type for the root dialog container element
 */
export type { DialogRef } from './types';

/**
 * DialogContentRef - Content component ref
 * ElementRef type for dialog content container
 */
export type { DialogContentRef } from './types';

/**
 * DialogHeaderRef - Header component ref
 * ElementRef type for dialog header container
 */
export type { DialogHeaderRef } from './types';

/**
 * DialogFooterRef - Footer component ref
 * ElementRef type for dialog footer container
 */
export type { DialogFooterRef } from './types';

/**
 * DialogTitleRef - Title component ref
 * ElementRef type for dialog title heading element
 */
export type { DialogTitleRef } from './types';

/**
 * DialogDescriptionRef - Description component ref
 * ElementRef type for dialog description paragraph element
 */
export type { DialogDescriptionRef } from './types';

// =============================================================================
// UTILITY AND CONFIGURATION EXPORTS
// =============================================================================

/**
 * Default Configuration Objects
 * 
 * Pre-configured objects providing sensible defaults for dialog behavior,
 * accessibility compliance, and responsive design. These defaults ensure
 * consistent behavior across the application while allowing customization.
 */

/**
 * DEFAULT_ANIMATION_CONFIG - Default animation settings
 * 
 * Optimized animation configuration balancing smooth transitions with
 * performance and accessibility requirements. Includes reduced motion
 * support and Tailwind CSS integration.
 * 
 * Features:
 * - Performance-optimized timing (300ms default)
 * - Ease-out transitions for natural feel
 * - Reduced motion accessibility compliance
 * - Fade animations for broad compatibility
 * - Backdrop blur effects
 * 
 * @example
 * ```tsx
 * <Dialog animation={{
 *   ...DEFAULT_ANIMATION_CONFIG,
 *   timing: 'slow', // Override specific properties
 *   customDuration: 500
 * }}>
 * ```
 */
export { DEFAULT_ANIMATION_CONFIG } from './types';

/**
 * DEFAULT_RESPONSIVE_CONFIG - Default responsive behavior
 * 
 * Mobile-first responsive configuration ensuring optimal user experience
 * across all device types and screen sizes. Includes touch-friendly
 * optimizations and accessibility compliance.
 * 
 * Features:
 * - Mobile-first breakpoint progression
 * - Fullscreen mobile presentation
 * - Swipe gesture support
 * - WCAG touch target compliance (44px minimum)
 * - Safe area inset handling
 * - Orientation adaptation
 * 
 * @example
 * ```tsx
 * <Dialog responsive={{
 *   ...DEFAULT_RESPONSIVE_CONFIG,
 *   mobile: {
 *     ...DEFAULT_RESPONSIVE_CONFIG.mobile,
 *     swipeToClose: false // Disable specific feature
 *   }
 * }}>
 * ```
 */
export { DEFAULT_RESPONSIVE_CONFIG } from './types';

/**
 * DEFAULT_A11Y_CONFIG - Default accessibility settings
 * 
 * Comprehensive WCAG 2.1 AA compliant accessibility configuration ensuring
 * inclusive user experience for all users including those using assistive
 * technologies.
 * 
 * Features:
 * - Focus trap with restore on close
 * - Keyboard navigation support
 * - Screen reader announcements
 * - ARIA attribute management
 * - High contrast compatibility
 * - Reduced motion support
 * 
 * @example
 * ```tsx
 * <Dialog a11y={{
 *   ...DEFAULT_A11Y_CONFIG,
 *   announcements: {
 *     ...DEFAULT_A11Y_CONFIG.announcements,
 *     onOpen: 'Database connection dialog opened'
 *   }
 * }}>
 * ```
 */
export { DEFAULT_A11Y_CONFIG } from './types';

/**
 * Enumeration Constants
 * 
 * Exported enumeration objects providing IntelliSense support and
 * type-safe access to dialog configuration options.
 */

/**
 * DialogSize - Size enumeration object
 * 
 * Enumeration object for dialog size options with type-safe access
 * and IntelliSense support in IDEs.
 * 
 * @example
 * ```tsx
 * <Dialog size={DialogSize.LG}>
 *   // Large dialog content
 * </Dialog>
 * ```
 */
export { DialogSize } from './types';

/**
 * DialogPosition - Position enumeration object
 * 
 * Enumeration object for dialog positioning options with responsive
 * behavior and accessibility considerations.
 * 
 * @example
 * ```tsx
 * <Dialog 
 *   variant="sheet" 
 *   position={DialogPosition.BOTTOM}
 * >
 *   // Bottom sheet presentation
 * </Dialog>
 * ```
 */
export { DialogPosition } from './types';

/**
 * DialogAnimationTiming - Animation timing enumeration
 * 
 * Enumeration object for animation timing presets optimized for
 * different use cases and accessibility requirements.
 * 
 * @example
 * ```tsx
 * <Dialog animation={{
 *   timing: DialogAnimationTiming.FAST,
 *   respectReducedMotion: true
 * }}>
 * ```
 */
export { DialogAnimationTiming } from './types';

// =============================================================================
// UTILITY TYPE EXPORTS
// =============================================================================

/**
 * Advanced Utility Types
 * 
 * Specialized TypeScript utility types for advanced dialog scenarios
 * including variant-specific props and event handling.
 */

/**
 * ExtractDialogProps - Variant-specific prop extraction
 * 
 * Utility type for extracting variant-specific dialog props with
 * type safety and IntelliSense support for each dialog variant.
 * 
 * @template T - Dialog variant type
 * 
 * @example
 * ```tsx
 * type ModalProps = ExtractDialogProps<'modal'>;
 * type SheetProps = ExtractDialogProps<'sheet'>;
 * ```
 */
export type { ExtractDialogProps } from './types';

/**
 * DialogEventHandlers - Event handler interface
 * 
 * Comprehensive interface for dialog event handling including lifecycle
 * events, user interactions, and accessibility events.
 * 
 * Features:
 * - Lifecycle events (open, close)
 * - Animation events (start, end)
 * - Interaction events (escape, outside click)
 * - Accessibility events (focus trap)
 * 
 * @example
 * ```tsx
 * const handlers: DialogEventHandlers = {
 *   onOpen: () => analytics.track('dialog_opened'),
 *   onClose: () => cleanup(),
 *   onEscapeKeyDown: (e) => handleEscape(e)
 * };
 * ```
 */
export type { DialogEventHandlers } from './types';

/**
 * DialogThemeConfig - Theme integration interface
 * 
 * Interface for dialog theme configuration supporting the design system
 * token architecture and dark/light mode integration.
 * 
 * Features:
 * - Variant-specific styling tokens
 * - Z-index layer management
 * - Responsive breakpoint integration
 * - Theme token compatibility
 * 
 * @example
 * ```tsx
 * const customTheme: DialogThemeConfig = {
 *   backgrounds: {
 *     modal: 'bg-white dark:bg-gray-900',
 *     sheet: 'bg-gray-50 dark:bg-gray-800'
 *   }
 * };
 * ```
 */
export type { DialogThemeConfig } from './types';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module Version and Compatibility Information
 * 
 * Version information and compatibility metadata for the dialog component
 * system, supporting version checking and migration assistance.
 */

/**
 * DIALOG_VERSION - Component version string
 * 
 * Semantic version string for the dialog component system, useful for
 * debugging, compatibility checking, and migration planning.
 */
export const DIALOG_VERSION = '1.0.0' as const;

/**
 * DIALOG_COMPATIBILITY - Framework compatibility information
 * 
 * Compatibility metadata including supported React, Next.js, and TypeScript
 * versions for integration planning and dependency management.
 */
export const DIALOG_COMPATIBILITY = {
  react: '>=19.0.0',
  nextjs: '>=15.1.0',
  typescript: '>=5.8.0',
  tailwindcss: '>=4.1.0'
} as const;

/**
 * DIALOG_FEATURES - Feature flag enumeration
 * 
 * Feature availability flags for conditional functionality and
 * progressive enhancement support.
 */
export const DIALOG_FEATURES = {
  ANIMATIONS: true,
  RESPONSIVE: true,
  ACCESSIBILITY: true,
  ASYNC_WORKFLOWS: true,
  TOUCH_GESTURES: true,
  SSR_SUPPORT: true,
  CONCURRENT_MODE: true
} as const;

// =============================================================================
// DEVELOPMENT AND DEBUGGING EXPORTS
// =============================================================================

/**
 * Development Utilities
 * 
 * Utilities for development, debugging, and testing of dialog components.
 * These exports are useful during development but should not be used in
 * production code.
 * 
 * @internal
 */

/**
 * Dialog Context Hook - Internal context access
 * 
 * Internal hook for accessing dialog context. Primarily used for testing
 * and debugging compound component integration.
 * 
 * @internal
 * @example
 * ```tsx
 * // For testing purposes only
 * import { useDialogContext } from '@/components/ui/dialog';
 * 
 * function TestComponent() {
 *   const context = useDialogContext();
 *   return <div data-testid="dialog-state">{context.open ? 'open' : 'closed'}</div>;
 * }
 * ```
 */
// Note: useDialogContext is internal and not exported for external use

/**
 * Type Validation Utilities
 * 
 * Development utilities for validating dialog props and configuration
 * during development and testing phases.
 * 
 * @internal
 */
// Note: Internal validation utilities are not exported to maintain clean API surface

// =============================================================================
// EXPORT SUMMARY
// =============================================================================

/**
 * Export Summary:
 * 
 * This barrel export provides comprehensive access to the dialog component system:
 * 
 * **Components (6):**
 * - Dialog (main component)
 * - Content, Header, Footer, Title, Description, Close (compound components)
 * 
 * **Hooks (1):**
 * - useDialog (state management)
 * 
 * **Types (20+):**
 * - Core interfaces for all components
 * - Configuration and utility types
 * - Promise-based workflow types
 * - React 19 compatible ref types
 * 
 * **Constants (6):**
 * - Default configurations for animation, responsive, accessibility
 * - Enumeration objects for type-safe option selection
 * - Version and compatibility metadata
 * 
 * **Features Supported:**
 * ✅ React 19 compound component architecture
 * ✅ Next.js 15.1 app router compatibility  
 * ✅ TypeScript 5.8+ complete type safety
 * ✅ WCAG 2.1 AA accessibility compliance
 * ✅ Mobile-first responsive design
 * ✅ Tailwind CSS 4.1+ integration
 * ✅ Promise-based async workflows
 * ✅ Multiple dialog variants and sizes
 * ✅ Smooth animations and transitions
 * ✅ Focus management and keyboard navigation
 * ✅ Screen reader and assistive technology support
 * ✅ Touch gesture support for mobile devices
 * ✅ SSR and concurrent mode compatibility
 * 
 * This comprehensive export structure ensures clean imports while providing
 * access to all dialog functionality throughout the React/Next.js application.
 */