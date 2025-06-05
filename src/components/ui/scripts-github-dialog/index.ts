/**
 * Scripts GitHub Dialog Component Exports
 * 
 * Barrel export file for the GitHub script import dialog component.
 * Provides clean imports for the main component and related types.
 */

export { ScriptsGitHubDialog as default, ScriptsGitHubDialog } from './scripts-github-dialog';

// Re-export types for convenience
export type {
  GitHubDialogResult,
  GitHubUrlInfo,
  GitHubCredentials,
  GitHubRepository,
  GitHubFileContent,
} from '@/types/github';

export type {
  GitHubDialogFormData,
} from '@/lib/validation-schemas';