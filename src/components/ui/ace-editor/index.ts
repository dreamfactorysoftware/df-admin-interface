/**
 * ACE Editor Component Barrel Export
 * 
 * Provides clean import interface for the ACE editor component and related types.
 * Supports React 19 patterns with proper TypeScript definitions and tree-shaking.
 * 
 * Usage:
 * ```typescript
 * import { AceEditor, AceEditorMode } from '@/components/ui/ace-editor';
 * import type { AceEditorProps, AceEditorRef } from '@/components/ui/ace-editor';
 * ```
 * 
 * Features:
 * - Tree-shaking compatible exports for optimal bundle size with Turbopack
 * - TypeScript export patterns for enhanced IDE support and autocompletion
 * - Consistent with other UI component export structures
 * - React component library patterns for clean API surface
 */

// Main component export
export { default as AceEditor } from './ace-editor';

// Component types and interfaces
export type { AceEditorProps, AceEditorRef } from './ace-editor';

// Core types and enums from types file
export {
  AceEditorMode,
} from './types';

// Type-only exports for interfaces and configurations
export type {
  AceEditorTheme,
  AceEditorSize,
  AceEditorConfig,
  AceEditorCallbacks,
  AceEditorFormControl,
  AceEditorAccessibilityProps,
  AceEditorValidationProps,
  AceEditorStateProps,
  AceEditorComponent,
  AceEditorThemeContext,
  AceEditorInstance,
  AceEditorEvents,
  AceEditorModeMap,
  EnhancedAceEditorConfig,
  AceModePath,
  AceThemePath,
} from './types';

// Default export for convenience
export { default } from './ace-editor';