/**
 * File GitHub Component - Barrel Export
 * 
 * Provides clean import interface for the file-github component system.
 * Supports dual workflows for local file uploads and GitHub repository integration.
 * 
 * @usage
 * ```typescript
 * import { FileGithub, FileGithubProps, GitHubImportResult } from '@/components/ui/file-github'
 * ```
 */

// Main component export
export { FileGithub } from './file-github';

// Type exports for external consumption
export type {
  FileGithubProps,
  FileUploadEvent,
  GitHubImportResult,
  StorageService,
  AceEditorMode,
  FileGithubRef,
  GitHubCredentials,
  FileValidationError,
  ThemeMode
} from './types';

// Default export for backwards compatibility
export { FileGithub as default } from './file-github';