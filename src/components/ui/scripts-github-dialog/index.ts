/**
 * @fileoverview Barrel export file for GitHub Scripts Dialog Component System
 * @version 1.0.0
 * @since 2024-12-19
 * 
 * Centralized export structure for the GitHub scripts dialog component and related types.
 * Provides clean imports for React 19 components with TypeScript definitions and utility
 * functions for GitHub repository integration.
 * 
 * Key Features:
 * - Tree-shaking support for optimal bundle size with Turbopack
 * - TypeScript export patterns for enhanced IDE support
 * - Clean component import structure for React 19 components
 * - Named exports for component, interfaces, and utility functions
 * - React component library export patterns for clean API surface
 * 
 * Usage Examples:
 * ```typescript
 * // Import main component
 * import { ScriptsGithubDialog } from '@/components/ui/scripts-github-dialog';
 * 
 * // Import specific types
 * import type { 
 *   ScriptsGithubDialogProps, 
 *   GitHubScriptContent,
 *   DialogState 
 * } from '@/components/ui/scripts-github-dialog';
 * 
 * // Import utilities
 * import { 
 *   isGitHubFileUrl, 
 *   DEFAULT_FILE_CONFIG 
 * } from '@/components/ui/scripts-github-dialog';
 * ```
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

export {
  ScriptsGithubDialog,
  default as ScriptsGithubDialogDefault
} from './scripts-github-dialog';

// =============================================================================
// CORE TYPE EXPORTS
// =============================================================================

export type {
  // Primary component props
  ScriptsGithubDialogProps,
  DialogAriaConfig,
  
  // Component state and context
  DialogStateContext,
  ScriptsGithubDialogRef,
  
  // Form and validation types
  GitHubUrlFormData,
  GitHubDialogFormState,
  FormValidationSchema,
} from './types';

// =============================================================================
// GITHUB API TYPE EXPORTS
// =============================================================================

export type {
  // Repository and user information
  GitHubRepositoryInfo,
  GitHubUserInfo,
  GitHubRepositoryPermissions,
  
  // File content and metadata
  GitHubFileContent,
  GitHubScriptContent,
  FileMetadata,
  
  // API response types
  GitHubApiResponse,
  GitHubRepositoryResponse,
  GitHubFileResponse,
  GitHubUserResponse,
  
  // URL parsing
  GitHubUrlParts,
} from './types';

// =============================================================================
// AUTHENTICATION TYPE EXPORTS
// =============================================================================

export type {
  // Authentication credentials and state
  GitHubAuthCredentials,
  GitHubAuthState,
  GitHubRateLimit,
} from './types';

// =============================================================================
// FILE VALIDATION TYPE EXPORTS
// =============================================================================

export type {
  // File types and configuration
  ScriptFileExtension,
  ScriptLanguage,
  ScriptFileConfig,
  FileProcessingOptions,
  ValidationResult,
  
  // Type mappings
  ExtensionLanguageMap,
} from './types';

// =============================================================================
// STATE MANAGEMENT TYPE EXPORTS
// =============================================================================

export {
  // Dialog state enumeration
  DialogState
} from './types';

export type {
  // State management types
  DialogStates,
} from './types';

// =============================================================================
// ERROR HANDLING TYPE EXPORTS
// =============================================================================

export type {
  // Error types and interfaces
  GitHubDialogError,
  GitHubDialogErrorType,
  GitHubErrorContext,
  ErrorRecoveryOptions,
} from './types';

// =============================================================================
// CALLBACK TYPE EXPORTS
// =============================================================================

export type {
  // Event handler types
  OnSuccessCallback,
  OnErrorCallback,
  OnStateChangeCallback,
  OnProgressCallback,
  DialogEventHandlers,
} from './types';

// =============================================================================
// UTILITY TYPE EXPORTS
// =============================================================================

export type {
  // Component and props utilities
  PartialDialogProps,
  RequiredDialogProps,
  DialogConfiguration,
  ComponentProps,
} from './types';

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

export {
  // Default configuration
  DEFAULT_FILE_CONFIG,
  
  // Extension mappings
  EXTENSION_LANGUAGE_MAP,
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

export {
  // Type guards and validators
  isGitHubDialogError,
  isGitHubFileUrl,
} from './types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Default export - main component for direct import compatibility
 * Supports both named and default import patterns
 */
export { ScriptsGithubDialog as default } from './scripts-github-dialog';

// =============================================================================
// TYPE-ONLY EXPORTS (EXPLICIT)
// =============================================================================

/**
 * Explicitly type-only exports for better tree-shaking
 * These ensure that only type information is imported, not runtime code
 */
export type {
  ScriptsGithubDialogProps as Props,
  GitHubScriptContent as ScriptContent,
  GitHubDialogError as DialogError,
  DialogState as State,
  ScriptFileExtension as FileExtension,
  ScriptLanguage as Language,
} from './types';