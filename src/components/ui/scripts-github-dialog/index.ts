/**
 * GitHub Scripts Import Dialog Component System
 * 
 * Barrel export file providing centralized access to the GitHub scripts import dialog
 * component, type definitions, utility functions, and hooks. Enables clean imports
 * throughout the React 19/Next.js 15.1 application following modern conventions.
 * 
 * @example
 * ```tsx
 * import { ScriptsGithubDialog, type ScriptsGithubDialogProps } from '@/components/ui/scripts-github-dialog';
 * import { validateGithubUrl, detectRepositoryInfo } from '@/components/ui/scripts-github-dialog';
 * ```
 */

// Main Component Exports
export { default as ScriptsGithubDialog } from './scripts-github-dialog';
export { ScriptsGithubDialog as ScriptsGithubDialogComponent } from './scripts-github-dialog';

// Type Definitions Export
export type {
  ScriptsGithubDialogProps,
  GitHubRepositoryInfo,
  GitHubAuthCredentials,
  ScriptFileConfig,
  GitHubApiResponse,
  GitHubFileContent,
  FormValidationSchema,
  DialogState,
  ScriptImportResult,
  GitHubErrorResponse,
  RepositoryVisibility,
  SupportedScriptExtension,
  GitHubUrlParseResult,
  AuthenticationMethod,
  ImportProgressState,
  ValidationError
} from './types';

// Utility Functions Export
export {
  validateGithubUrl,
  parseGithubUrl,
  detectRepositoryInfo,
  extractFileExtension,
  buildGithubApiUrl,
  isValidScriptFile,
  parseRepositoryPath,
  sanitizeFileContent
} from './utils';

// Custom Hooks Export
export {
  useGithubApi,
  useGithubAuth,
  useRepositoryValidation,
  useScriptImport,
  useGithubUrlParser
} from './hooks';

// Constants Export
export {
  SUPPORTED_SCRIPT_EXTENSIONS,
  GITHUB_API_BASE_URL,
  DEFAULT_DIALOG_CONFIG,
  VALIDATION_DEBOUNCE_MS,
  MAX_FILE_SIZE_BYTES
} from './constants';

// Re-export commonly used types for convenience
export type {
  DialogProps,
  DialogState as BaseDialogState
} from '../dialog/types';

/**
 * Default export for the main component
 * Enables import ScriptsGithubDialog from 'path' syntax
 */
export { default } from './scripts-github-dialog';