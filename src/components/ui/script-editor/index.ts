/**
 * @fileoverview Script Editor Component Barrel Export
 * @description Centralized export file for the script editor component system,
 * providing clean imports for React 19 components, hooks, types, and utilities.
 * Optimized for tree-shaking with Turbopack and maintains TypeScript 5.8+ compatibility.
 * 
 * @example
 * ```typescript
 * // Named imports for specific components
 * import { ScriptEditor, useScriptEditor } from '@/components/ui/script-editor';
 * 
 * // Type imports for props and configuration
 * import type { ScriptEditorProps, ScriptEditorConfig } from '@/components/ui/script-editor';
 * ```
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main Script Editor Component
 * @description React 19 functional component providing advanced script editing capabilities
 * with ACE editor integration, syntax highlighting, and React Hook Form compatibility.
 * Supports multiple scripting languages and real-time validation under 100ms.
 */
export { default as ScriptEditor } from './script-editor';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * Script Editor Custom Hook
 * @description React hook providing script editor state management, validation logic,
 * and integration patterns for external components. Enables reusable script editing
 * functionality across the application with consistent behavior.
 */
export { useScriptEditor } from './hooks/use-script-editor';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Script Editor TypeScript Definitions
 * @description Comprehensive type definitions for component props, configuration interfaces,
 * and utility types. Provides enhanced IDE support and compile-time type safety for
 * React 19 component integration patterns.
 */
export type {
  // Component Props Interface
  ScriptEditorProps,
  
  // Configuration Types
  ScriptEditorConfig,
  ScriptEditorMode,
  ScriptEditorOptions,
  
  // Event Handler Types
  ScriptEditorChangeHandler,
  ScriptEditorValidationHandler,
  ScriptEditorErrorHandler,
  
  // Hook Return Types
  UseScriptEditorReturn,
  UseScriptEditorOptions,
  
  // Validation Types
  ScriptValidationResult,
  ScriptValidationError,
  
  // Theme Integration Types
  ScriptEditorTheme,
  ScriptEditorAppearance
} from './types';

// =============================================================================
// UTILITY EXPORTS (IF NEEDED)
// =============================================================================

/**
 * Script Editor Utilities
 * @description Helper functions and constants for script editor configuration,
 * validation, and integration. Exported only if utilities are defined in the
 * component system to maintain tree-shaking efficiency.
 */
// Note: Uncomment and implement if utilities are created
// export * from './utils';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default Export for Convenient Importing
 * @description Provides the main ScriptEditor component as default export
 * for flexible import patterns while maintaining named export availability.
 */
export { default } from './script-editor';

// =============================================================================
// RE-EXPORTS FOR EXTERNAL DEPENDENCIES
// =============================================================================

/**
 * ACE Editor Mode Re-exports
 * @description Re-export commonly used ACE editor modes and configurations
 * to provide a unified import interface for script editor consumers.
 * This maintains compatibility with existing patterns while centralizing imports.
 */
// Note: These would be re-exported from ace-editor types if needed
// export { AceEditorMode } from '../ace-editor/types';