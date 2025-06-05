/**
 * TypeScript interface definitions for the GitHub scripts dialog component.
 * Migrated from Angular dialog types to React-specific patterns with proper typing
 * for controlled dialogs, GitHub API integration, and form validation.
 */

import { ReactNode } from 'react';
import { z } from 'zod';

// =============================================================================
// BASE DIALOG INTERFACES
// =============================================================================

/**
 * Base dialog props interface extending React's standard dialog patterns
 */
export interface BaseDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking the backdrop closes the dialog */
  closeOnBackdropClick?: boolean;
  /** Whether the escape key closes the dialog */
  closeOnEscape?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Test id for testing */
  'data-testid'?: string;
}

/**
 * Dialog result type for promise-based workflows
 */
export type DialogResult<T = unknown> = {
  /** Whether the dialog was confirmed or cancelled */
  confirmed: boolean;
  /** Data payload from the dialog */
  data?: T;
};

// =============================================================================
// GITHUB SCRIPTS DIALOG INTERFACES
// =============================================================================

/**
 * Props interface for the GitHub scripts dialog component
 */
export interface ScriptsGitHubDialogProps extends BaseDialogProps {
  /** Dialog title */
  title?: string;
  /** Dialog description or help text */
  description?: string;
  /** Callback when a script is successfully selected */
  onScriptSelect?: (result: GitHubScriptResult) => void;
  /** Callback when the dialog operation fails */
  onError?: (error: GitHubError) => void;
  /** Custom actions to render in the dialog footer */
  customActions?: ReactNode;
  /** Whether to show advanced options */
  showAdvancedOptions?: boolean;
}

/**
 * GitHub script file data structure from API response
 */
export interface GitHubFileData {
  /** File name */
  name: string;
  /** File path in repository */
  path: string;
  /** SHA hash of the file */
  sha: string;
  /** File size in bytes */
  size: number;
  /** File download URL */
  download_url: string;
  /** File content (base64 encoded) */
  content: string;
  /** Content encoding (usually 'base64') */
  encoding: string;
  /** File type */
  type: 'file' | 'dir';
  /** GitHub API URL for the file */
  url: string;
  /** Git URL for the file */
  git_url: string;
  /** HTML URL for the file */
  html_url: string;
}

/**
 * GitHub repository metadata from API response
 */
export interface GitHubRepoData {
  /** Repository ID */
  id: number;
  /** Repository name */
  name: string;
  /** Full repository name (owner/repo) */
  full_name: string;
  /** Repository description */
  description?: string;
  /** Whether the repository is private */
  private: boolean;
  /** Repository owner information */
  owner: {
    /** Owner login username */
    login: string;
    /** Owner ID */
    id: number;
    /** Owner type (User or Organization) */
    type: 'User' | 'Organization';
  };
  /** Default branch name */
  default_branch: string;
  /** Repository clone URL */
  clone_url: string;
  /** SSH clone URL */
  ssh_url: string;
  /** Repository HTML URL */
  html_url: string;
  /** Repository creation date */
  created_at: string;
  /** Repository last update date */
  updated_at: string;
}

/**
 * Authentication credentials for private repositories
 */
export interface GitHubAuthCredentials {
  /** GitHub username */
  username: string;
  /** Personal access token or password */
  password: string;
}

/**
 * Parsed GitHub URL components
 */
export interface GitHubUrlParts {
  /** Repository owner username */
  owner: string;
  /** Repository name */
  repo: string;
  /** File path within the repository */
  filePath: string;
  /** Original URL */
  originalUrl: string;
  /** Whether the URL is valid */
  isValid: boolean;
}

/**
 * Dialog result when a script is successfully selected
 */
export interface GitHubScriptResult {
  /** File content */
  content: string;
  /** File metadata */
  fileData: GitHubFileData;
  /** Repository metadata */
  repoData?: GitHubRepoData;
  /** Parsed URL parts */
  urlParts: GitHubUrlParts;
}

/**
 * Dialog result when operation is cancelled
 */
export interface GitHubDialogCancelResult {
  /** Always false for cancelled operations */
  confirmed: false;
  /** Cancellation reason */
  reason: 'user_cancelled' | 'escape_pressed' | 'backdrop_clicked';
}

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

/**
 * Form data structure for the GitHub scripts dialog
 */
export interface GitHubFormData {
  /** GitHub file URL */
  url: string;
  /** Username for private repositories */
  username?: string;
  /** Personal access token for private repositories */
  password?: string;
}

/**
 * Form field configuration for dynamic rendering
 */
export interface GitHubFormField {
  /** Field name */
  name: keyof GitHubFormData;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'password' | 'url';
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required: boolean;
  /** Whether the field is visible */
  visible: boolean;
  /** Field validation rules */
  validation?: {
    /** Minimum length */
    minLength?: number;
    /** Maximum length */
    maxLength?: number;
    /** Pattern for validation */
    pattern?: RegExp;
    /** Custom validation message */
    message?: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schema for GitHub URL
 */
export const GitHubUrlSchema = z
  .string()
  .min(1, 'GitHub URL is required')
  .url('Must be a valid URL')
  .refine(
    (url) => {
      // Check if it's a GitHub URL with supported file extensions
      const supportedExtensions = ['.js', '.py', '.php', '.txt', '.json', '.ts', '.jsx', '.tsx'];
      return (
        url.includes('github.com') &&
        supportedExtensions.some(ext => url.includes(ext))
      );
    },
    {
      message: 'Must be a GitHub URL pointing to a script file (.js, .py, .php, .txt, .json, .ts, .jsx, .tsx)',
    }
  );

/**
 * Zod validation schema for GitHub authentication credentials
 */
export const GitHubAuthSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required for private repositories')
    .max(39, 'GitHub username cannot exceed 39 characters'),
  password: z
    .string()
    .min(1, 'Personal access token is required for private repositories')
    .min(40, 'GitHub personal access tokens are typically 40+ characters'),
});

/**
 * Zod validation schema for the complete form
 */
export const GitHubFormSchema = z.object({
  url: GitHubUrlSchema,
  username: z.string().optional(),
  password: z.string().optional(),
}).refine(
  (data) => {
    // If username is provided, password must also be provided
    if (data.username && !data.password) {
      return false;
    }
    if (data.password && !data.username) {
      return false;
    }
    return true;
  },
  {
    message: 'Both username and password must be provided for private repositories',
    path: ['username'],
  }
);

/**
 * Type inference from Zod schemas
 */
export type GitHubFormSchemaType = z.infer<typeof GitHubFormSchema>;
export type GitHubUrlSchemaType = z.infer<typeof GitHubUrlSchema>;
export type GitHubAuthSchemaType = z.infer<typeof GitHubAuthSchema>;

// =============================================================================
// ERROR HANDLING INTERFACES
// =============================================================================

/**
 * GitHub API error types
 */
export type GitHubErrorType = 
  | 'network_error'
  | 'authentication_failed'
  | 'repository_not_found'
  | 'file_not_found'
  | 'invalid_url'
  | 'rate_limit_exceeded'
  | 'forbidden_access'
  | 'unknown_error';

/**
 * Comprehensive error interface for GitHub operations
 */
export interface GitHubError {
  /** Error type for programmatic handling */
  type: GitHubErrorType;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** GitHub API error code if applicable */
  githubErrorCode?: string;
  /** Original error object */
  originalError?: unknown;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Suggested recovery actions */
  suggestions?: string[];
}

// =============================================================================
// DIALOG STATE INTERFACES
// =============================================================================

/**
 * Dialog internal state interface
 */
export interface GitHubDialogState {
  /** Whether the dialog is loading */
  loading: boolean;
  /** Current error if any */
  error: GitHubError | null;
  /** Whether repository is private */
  isPrivateRepo: boolean;
  /** Repository metadata */
  repoData: GitHubRepoData | null;
  /** File metadata */
  fileData: GitHubFileData | null;
  /** Parsed URL parts */
  urlParts: GitHubUrlParts | null;
  /** Form validation errors */
  formErrors: Partial<Record<keyof GitHubFormData, string>>;
}

/**
 * Dialog action types for state management
 */
export type GitHubDialogAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: GitHubError | null }
  | { type: 'SET_PRIVATE_REPO'; payload: boolean }
  | { type: 'SET_REPO_DATA'; payload: GitHubRepoData | null }
  | { type: 'SET_FILE_DATA'; payload: GitHubFileData | null }
  | { type: 'SET_URL_PARTS'; payload: GitHubUrlParts | null }
  | { type: 'SET_FORM_ERRORS'; payload: Partial<Record<keyof GitHubFormData, string>> }
  | { type: 'RESET_STATE' };

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Type for dialog promise resolution
 */
export type GitHubDialogPromise = Promise<DialogResult<GitHubScriptResult>>;

/**
 * Configuration options for the GitHub service
 */
export interface GitHubServiceConfig {
  /** GitHub API base URL */
  apiBaseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include authentication headers */
  includeAuth?: boolean;
  /** Rate limiting configuration */
  rateLimiting?: {
    /** Requests per hour */
    requestsPerHour: number;
    /** Requests per minute */
    requestsPerMinute: number;
  };
}

/**
 * GitHub API response wrapper
 */
export interface GitHubApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** Response status */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Rate limit information */
  rateLimit?: {
    /** Remaining requests */
    remaining: number;
    /** Rate limit reset time */
    reset: number;
    /** Total requests allowed */
    limit: number;
  };
}

/**
 * Export all types for barrel export
 */
export type {
  BaseDialogProps,
  DialogResult,
  ScriptsGitHubDialogProps,
  GitHubFileData,
  GitHubRepoData,
  GitHubAuthCredentials,
  GitHubUrlParts,
  GitHubScriptResult,
  GitHubDialogCancelResult,
  GitHubFormData,
  GitHubFormField,
  GitHubError,
  GitHubErrorType,
  GitHubDialogState,
  GitHubDialogAction,
  GitHubDialogPromise,
  GitHubServiceConfig,
  GitHubApiResponse,
  GitHubFormSchemaType,
  GitHubUrlSchemaType,
  GitHubAuthSchemaType,
};